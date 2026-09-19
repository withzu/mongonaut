'use server';

import { BSON, type Document, type Filter, type IndexSpecification, type Sort } from 'mongodb';

import {
	getMongoController,
	validateCollectionName,
	validateDatabaseName,
	type IndexSummary,
} from '@/lib/mongoController';
import { Collection, Database } from '@/lib/types/mongo';
import { clampInt, envBool, envInt } from '@/lib/env';
import {
	canAdministerInstance,
	canReadCollection,
	canReadDatabase,
	canWriteResource,
	describeActor,
	getAccessContext,
	guardAccess,
	guardAggregation,
	isGlobalReadonly,
	isHiddenDb,
	isServerJsAllowed,
	requireAnyAccess,
	requireInstanceAdmin,
	serverJsMessage,
} from '@/lib/auth/server';
import { INTERNAL_DB } from '@/lib/auth/accounts';
import { audit } from '@/lib/mongo/audit';
import { findServerJsOperators } from '@/lib/mongo/pipeline';
import {
	documentRevision,
	parseDocumentId,
	parseDocumentJsonArray,
	parseDocumentJsonObject,
	stringifyDocumentId,
	stringifyDocumentJson,
} from '@/lib/mongo/document-json';

const { EJSON } = BSON;

const mongo = getMongoController();

const DEFAULT_PAGE_SIZE = 20;

export type ActionResult<T = undefined> =
	{ success: true; data: T } | { success: false; error: string };

function failure(error: string): ActionResult<never> {
	return { success: false, error };
}

function success<T>(data: T): ActionResult<T> {
	return { success: true, data };
}

function maxPageSize(): number {
	return envInt('MONGONAUT_MAX_PAGE_SIZE', 200, { min: 1, max: 1000 });
}

function exportLimit(): number {
	return envInt('MONGONAUT_EXPORT_MAX_DOCUMENTS', 50_000, { min: 1 });
}

function importLimit(): number {
	return envInt('MONGONAUT_IMPORT_MAX_DOCUMENTS', 10_000, { min: 1 });
}

function messageOf(error: unknown, fallback: string): string {
	return error instanceof Error && error.message ? error.message : fallback;
}

async function mapLimited<T, R>(
	items: T[],
	limit: number,
	task: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let cursor = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (cursor < items.length) {
			const index = cursor++;
			results[index] = await task(items[index]);
		}
	});
	await Promise.all(workers);
	return results;
}

// ---------------------------------------------------------------------------
// Instance information
// ---------------------------------------------------------------------------

export const getServerInfo = async (): Promise<ActionResult<Document>> => {
	const guard = await requireAnyAccess();
	if (!guard.allowed) return failure(guard.error);
	return await mongo.getServerInfo();
};

export interface ViewerInfo {
	isAccountAdmin: boolean;
	canCreateDatabase: boolean;
	globalReadonly: boolean;
	mode: string;
	authenticated: boolean;
}

export const getViewerInfo = async (): Promise<ViewerInfo> => {
	const ctx = await getAccessContext();
	const isAccountAdmin = ctx.mode === 'ACCOUNT' && !!ctx.account?.isAdmin;
	const authenticated = ctx.mode === 'NONE' || ctx.authenticated;
	return {
		isAccountAdmin,
		canCreateDatabase: canAdministerInstance(ctx),
		globalReadonly: isGlobalReadonly(),
		mode: ctx.mode,
		authenticated,
	};
};

export const listDatabases = async (): Promise<
	ActionResult<{ databases: { name: string; sizeOnDisk?: number }[]; totalSize: number }>
> => {
	const ctx = await getAccessContext();
	const result = await mongo.listDatabases();
	if (!result.success) return result;

	const databases = result.data.databases.filter(
		db => !isHiddenDb(db.name) && canReadDatabase(ctx, db.name),
	);
	const totalSize = databases.reduce((sum, db) => sum + (db.sizeOnDisk || 0), 0);
	return success({ databases, totalSize });
};

export const collectSidebarDatabaseInformation = async (): Promise<ActionResult<Database[]>> => {
	const ctx = await getAccessContext();
	const databasesResult = await mongo.listDatabases();
	if (!databasesResult.success) return databasesResult;

	const statsEnabled = envBool('MONGONAUT_SIDEBAR_STATS', true);
	const statsMaxCollections = envInt('MONGONAUT_SIDEBAR_STATS_MAX_COLLECTIONS', 100, { min: 0 });

	const visible = databasesResult.data.databases.filter(
		database => !isHiddenDb(database.name) && canReadDatabase(ctx, database.name),
	);

	const collected: Database[] = [];
	for (const database of visible) {
		const collectionsResult = await mongo.getDatabaseCollections(database.name);
		if (!collectionsResult.success) {
			console.warn(
				`[mongonaut] could not list collections of "${database.name}": ${collectionsResult.error}`,
			);
			continue;
		}

		const collections = collectionsResult.data.filter(
			entry =>
				entry.name !== '__mongonaut_init' && canReadCollection(ctx, database.name, entry.name),
		);

		const withStats = statsEnabled && collections.length <= statsMaxCollections;

		const entries: Collection[] = withStats
			? await mapLimited(collections, 8, async entry => {
					const stats = await mongo.getCollectionStats(database.name, entry.name);
					return {
						name: entry.name,
						totalSize: stats.success ? stats.data.size : null,
						documentCount: stats.success ? stats.data.count : null,
						canWrite: canWriteResource(ctx, database.name, entry.name),
					};
				})
			: collections.map(entry => ({
					name: entry.name,
					totalSize: null,
					documentCount: null,
					canWrite: canWriteResource(ctx, database.name, entry.name),
				}));

		collected.push({
			name: database.name,
			collections: entries,
			totalSize: database.sizeOnDisk || 0,
			canWrite: canWriteResource(ctx, database.name),
		});
	}

	return success(collected);
};

export const getCollectionStats = async (
	database: string,
	collection: string,
): Promise<ActionResult<{ size: number; count: number; avgObjSize: number }>> => {
	const guard = await guardAccess({ database, collection });
	if (!guard.allowed) return failure(guard.error);
	const result = await mongo.getCollectionStats(database, collection);
	if (!result.success) return result;
	return success({
		size: result.data.size,
		count: result.data.count,
		avgObjSize: result.data.avgObjSize,
	});
};

export const collectionExists = async (database: string, collection: string): Promise<boolean> => {
	const guard = await guardAccess({ database, collection });
	if (!guard.allowed) return false;
	const result = await mongo.collectionExists(database, collection);
	return result.success && result.data;
};

// ---------------------------------------------------------------------------
// Reading documents
// ---------------------------------------------------------------------------

export interface DocumentEnvelope {
	json: string;
	idJson: string | null;
	/** Fingerprint of `json`, sent back on save to detect a concurrent write. */
	revision: string;
}

// Not exported: a "use server" module may only export async functions.
const CONFLICT_MESSAGE =
	'This document changed after you opened it. Reload the collection and apply your change again.';

export interface DocumentPage {
	documents: DocumentEnvelope[];
	page: number;
	pageSize: number;
	total: number | null;
	totalPages: number | null;
	hasMore: boolean;
}

export interface DocumentQuery {
	mode?: 'browse' | 'find' | 'aggregate';
	filter?: string;
	sort?: string;
	pipeline?: string;
}

export interface LoadDocumentsInput extends DocumentQuery {
	database: string;
	collection: string;
	page?: unknown;
	pageSize?: unknown;
}

function resolveMode(query: DocumentQuery): 'browse' | 'find' | 'aggregate' {
	if (query.mode === 'aggregate' && query.pipeline) return 'aggregate';
	if (query.mode === 'find' || query.filter || query.sort) return 'find';
	return 'browse';
}

function parseFilterAndSort(query: DocumentQuery): { filter: Filter<Document>; sort: Sort } {
	return {
		filter: query.filter ? (EJSON.parse(query.filter, { relaxed: false }) as Filter<Document>) : {},
		sort: query.sort ? (EJSON.parse(query.sort, { relaxed: false }) as Sort) : {},
	};
}

function envelope(document: Document): DocumentEnvelope {
	const json = stringifyDocumentJson(document, 2);
	return {
		json,
		idJson: '_id' in document ? stringifyDocumentId(document._id) : null,
		revision: documentRevision(json),
	};
}

export const loadDocuments = async (
	input: LoadDocumentsInput,
): Promise<ActionResult<DocumentPage>> => {
	const { database, collection } = input;
	const page = clampInt(input.page, 1, { min: 1, max: 1_000_000 });
	const pageSize = clampInt(input.pageSize, DEFAULT_PAGE_SIZE, { min: 1, max: maxPageSize() });

	const mode = resolveMode(input);

	if (mode === 'aggregate') {
		let pipeline: Document[];
		try {
			const parsed = EJSON.parse(input.pipeline as string, { relaxed: false });
			if (!Array.isArray(parsed)) throw new Error('Aggregation pipeline must be a JSON array');
			pipeline = parsed as Document[];
		} catch (error) {
			return failure(messageOf(error, 'Invalid pipeline JSON'));
		}

		const guard = await guardAggregation(database, collection, pipeline);
		if (!guard.allowed) return failure(guard.error);

		const result = await mongo.aggregateDocuments(
			database,
			collection,
			pipeline,
			page,
			pageSize,
			guard.hasWriteStage,
		);
		if (!result.success) return result;
		if (guard.hasWriteStage) {
			audit({
				action: 'collection.aggregate.write',
				actor: describeActor(guard.ctx),
				outcome: 'success',
				database,
				collection,
			});
		}
		return success(toDocumentPage(result.data));
	}

	const guard = await guardAccess({ database, collection });
	if (!guard.allowed) return failure(guard.error);

	if (mode === 'find') {
		let filter: Filter<Document>;
		let sort: Sort;
		try {
			({ filter, sort } = parseFilterAndSort(input));
		} catch (error) {
			return failure(messageOf(error, 'Invalid query JSON'));
		}

		if (!isServerJsAllowed()) {
			const serverJs = findServerJsOperators([filter, sort]);
			if (serverJs.length > 0) return failure(serverJsMessage(serverJs));
		}

		const result = await mongo.findDocuments(database, collection, filter, sort, page, pageSize);
		if (!result.success) return result;
		return success(toDocumentPage(result.data));
	}

	const result = await mongo.browseDocuments(database, collection, page, pageSize);
	if (!result.success) return result;
	return success(toDocumentPage(result.data));
};

function toDocumentPage(result: {
	documents: Document[];
	page: number;
	pageSize: number;
	total: number | null;
	totalPages: number | null;
	hasMore: boolean;
}): DocumentPage {
	return { ...result, documents: result.documents.map(envelope) };
}

export const exportCollection = async (
	database: string,
	collection: string,
	query: DocumentQuery = {},
): Promise<
	ActionResult<{
		json: string;
		count: number;
		truncated: boolean;
		limit: number;
		filtered: boolean;
	}>
> => {
	const limit = exportLimit();
	const mode = resolveMode(query);

	// The export follows whatever the user is currently looking at. Exporting the
	// whole collection while a filter is applied would hand back documents the
	// user never asked for.
	let result: Awaited<ReturnType<typeof mongo.exportDocuments>>;
	let actor: string;

	if (mode === 'aggregate') {
		let pipeline: Document[];
		try {
			const parsed = EJSON.parse(query.pipeline as string, { relaxed: false });
			if (!Array.isArray(parsed)) throw new Error('Aggregation pipeline must be a JSON array');
			pipeline = parsed as Document[];
		} catch (error) {
			return failure(messageOf(error, 'Invalid pipeline JSON'));
		}

		const guard = await guardAggregation(database, collection, pipeline);
		if (!guard.allowed) return failure(guard.error);
		if (guard.hasWriteStage) {
			return failure('An aggregation that writes cannot be exported. Remove $out or $merge.');
		}
		actor = describeActor(guard.ctx);
		result = await mongo.exportAggregation(database, collection, pipeline, limit);
	} else {
		const guard = await guardAccess({ database, collection });
		if (!guard.allowed) return failure(guard.error);
		actor = describeActor(guard.ctx);

		let filter: Filter<Document>;
		let sort: Sort;
		try {
			({ filter, sort } = mode === 'find' ? parseFilterAndSort(query) : { filter: {}, sort: {} });
		} catch (error) {
			return failure(messageOf(error, 'Invalid query JSON'));
		}

		if (mode === 'find' && !isServerJsAllowed()) {
			const serverJs = findServerJsOperators([filter, sort]);
			if (serverJs.length > 0) return failure(serverJsMessage(serverJs));
		}

		result = await mongo.exportDocuments(database, collection, limit, filter, sort);
	}

	if (!result.success) return result;

	audit({
		action: 'collection.export',
		actor,
		outcome: 'success',
		database,
		collection,
		count: result.data.documents.length,
		detail: mode === 'browse' ? undefined : `mode=${mode}`,
	});

	return success({
		// Extended JSON keeps the export re-importable without losing BSON types.
		json: stringifyDocumentJson(result.data.documents, 2),
		count: result.data.documents.length,
		truncated: result.data.truncated,
		limit,
		filtered: mode !== 'browse',
	});
};

// ---------------------------------------------------------------------------
// Writing documents
// ---------------------------------------------------------------------------

export const addDocuments = async (
	database: string,
	collection: string,
	documentJson: string,
): Promise<ActionResult<{ insertedCount: number }>> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) {
		audit({
			action: 'document.insert',
			actor: describeActor(await getAccessContext()),
			outcome: 'denied',
			database,
			collection,
			detail: guard.error,
		});
		return failure(guard.error);
	}

	let documents: Document[];
	try {
		documents = parseDocumentJsonArray(documentJson);
	} catch (error) {
		return failure(messageOf(error, 'Invalid JSON'));
	}
	if (documents.length === 0) return failure('There is nothing to insert');
	if (documents.length > importLimit()) {
		return failure(`At most ${importLimit()} documents can be imported at once`);
	}

	const result = await mongo.insertDocuments(database, collection, documents);
	audit({
		action: 'document.insert',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		count: result.success ? result.data.insertedCount : documents.length,
		detail: result.success ? undefined : result.error,
	});
	if (!result.success) return result;
	return success({ insertedCount: result.data.insertedCount });
};

export const updateDocument = async (
	database: string,
	collection: string,
	idJson: string,
	documentJson: string,
	expectedRevision?: string,
): Promise<ActionResult<{ modified: boolean }>> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) return failure(guard.error);

	let documentId: unknown;
	let replacement: Document;
	try {
		documentId = parseDocumentId(idJson);
		replacement = parseDocumentJsonObject(documentJson);
	} catch (error) {
		return failure(messageOf(error, 'Invalid JSON'));
	}

	// A save replaces the whole document, so without this check two people
	// editing the same record would silently overwrite each other.
	if (expectedRevision) {
		const current = await mongo.findDocumentById(database, collection, documentId);
		if (!current.success) return current;
		if (!current.data) return failure('The document no longer exists');
		if (documentRevision(stringifyDocumentJson(current.data, 2)) !== expectedRevision) {
			audit({
				action: 'document.update',
				actor: describeActor(guard.ctx),
				outcome: 'denied',
				database,
				collection,
				target: idJson,
				detail: 'revision conflict',
			});
			return failure(CONFLICT_MESSAGE);
		}
	}

	const result = await mongo.replaceDocument(database, collection, documentId, replacement);
	audit({
		action: 'document.update',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		target: idJson,
		detail: result.success ? undefined : result.error,
	});
	if (!result.success) return result;
	if (result.data.matched === 0) return failure('The document no longer exists');
	return success({ modified: result.data.modified > 0 });
};

export const deleteDocument = async (
	database: string,
	collection: string,
	idJson: string,
): Promise<ActionResult<{ deleted: boolean }>> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) return failure(guard.error);

	let documentId: unknown;
	try {
		documentId = parseDocumentId(idJson);
	} catch (error) {
		return failure(messageOf(error, 'Invalid document id'));
	}

	const result = await mongo.deleteDocument(database, collection, documentId);
	audit({
		action: 'document.delete',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		target: idJson,
		detail: result.success ? undefined : result.error,
	});
	if (!result.success) return result;
	if (result.data.deleted === 0) return failure('The document no longer exists');
	return success({ deleted: true });
};

export const deleteAllDocuments = async (
	database: string,
	collection: string,
): Promise<ActionResult<{ deletedCount: number }>> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) return failure(guard.error);

	const result = await mongo.deleteAllDocuments(database, collection);
	audit({
		action: 'document.deleteAll',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		count: result.success ? result.data.deletedCount : undefined,
		detail: result.success ? undefined : result.error,
	});
	return result;
};

// ---------------------------------------------------------------------------
// Collections and databases
// ---------------------------------------------------------------------------

export const createCollection = async (
	database: string,
	collection: string,
): Promise<ActionResult> => {
	const guard = await guardAccess({ database, write: true });
	if (!guard.allowed) return failure(guard.error);

	const invalid = validateCollectionName(collection);
	if (invalid) return failure(invalid);

	const existing = await mongo.collectionExists(database, collection);
	if (existing.success && existing.data) {
		return failure(`A collection named "${collection}" already exists`);
	}

	const result = await mongo.createCollection(database, collection);
	audit({
		action: 'collection.create',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};

export const createDatabase = async (database: string): Promise<ActionResult> => {
	if (isGlobalReadonly()) return failure('Mongonaut is running in read-only mode');
	const guard = await requireInstanceAdmin();
	if (!guard.allowed) return failure(guard.error);

	const invalid = validateDatabaseName(database);
	if (invalid) return failure(invalid);
	if (isHiddenDb(database) || database === INTERNAL_DB) return failure('Reserved database name');

	const result = await mongo.createCollection(database, '__mongonaut_init');
	audit({
		action: 'database.create',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};

export const dropCollection = async (
	database: string,
	collection: string,
): Promise<ActionResult> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) {
		audit({
			action: 'collection.drop',
			actor: describeActor(await getAccessContext()),
			outcome: 'denied',
			database,
			collection,
			detail: guard.error,
		});
		return failure(guard.error);
	}

	const result = await mongo.dropCollection(database, collection);
	audit({
		action: 'collection.drop',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};

export const renameCollection = async (
	database: string,
	collection: string,
	newName: string,
): Promise<ActionResult> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) return failure(guard.error);
	const targetGuard = await guardAccess({ database, collection: newName, write: true });
	if (!targetGuard.allowed) return failure(targetGuard.error);

	const invalid = validateCollectionName(newName);
	if (invalid) return failure(invalid);

	const existing = await mongo.collectionExists(database, newName);
	if (existing.success && existing.data) {
		return failure(`A collection named "${newName}" already exists`);
	}

	const result = await mongo.renameCollection(database, collection, newName);
	audit({
		action: 'collection.rename',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		target: newName,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};

export const duplicateCollection = async (
	database: string,
	collection: string,
	targetName: string,
): Promise<ActionResult> => {
	const readGuard = await guardAccess({ database, collection });
	if (!readGuard.allowed) return failure(readGuard.error);
	const writeGuard = await guardAccess({ database, collection: targetName, write: true });
	if (!writeGuard.allowed) return failure(writeGuard.error);

	const invalid = validateCollectionName(targetName);
	if (invalid) return failure(invalid);
	if (targetName === collection) return failure('Please choose a different target name');

	// $out replaces an existing collection, so an occupied target would be
	// destroyed silently.
	const existing = await mongo.collectionExists(database, targetName);
	if (!existing.success) return existing;
	if (existing.data) {
		return failure(
			`A collection named "${targetName}" already exists. Duplicating would overwrite it.`,
		);
	}

	const result = await mongo.duplicateCollection(database, collection, targetName);
	audit({
		action: 'collection.duplicate',
		actor: describeActor(writeGuard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		target: targetName,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};

export const dropDatabase = async (database: string): Promise<ActionResult> => {
	if (isGlobalReadonly()) return failure('Mongonaut is running in read-only mode');
	const guard = await requireInstanceAdmin();
	if (!guard.allowed) {
		audit({
			action: 'database.drop',
			actor: describeActor(await getAccessContext()),
			outcome: 'denied',
			database,
			detail: guard.error,
		});
		return failure(guard.error);
	}
	if (isHiddenDb(database)) return failure('Reserved database name');

	const result = await mongo.dropDatabase(database);
	audit({
		action: 'database.drop',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

export const listIndexes = async (
	database: string,
	collection: string,
): Promise<ActionResult<IndexSummary[]>> => {
	const guard = await guardAccess({ database, collection });
	if (!guard.allowed) return failure(guard.error);
	return await mongo.listIndexes(database, collection);
};

export interface CreateIndexInput {
	keysJson: string;
	name?: string;
	unique?: boolean;
	sparse?: boolean;
	ttlSeconds?: number;
}

export const createIndex = async (
	database: string,
	collection: string,
	input: CreateIndexInput,
): Promise<ActionResult<{ name: string }>> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) return failure(guard.error);

	let keys: IndexSpecification;
	try {
		const parsed = JSON.parse(input.keysJson) as unknown;
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('Index keys must be a JSON object, for example { "email": 1 }');
		}
		if (Object.keys(parsed).length === 0) throw new Error('Please specify at least one field');
		keys = parsed as IndexSpecification;
	} catch (error) {
		return failure(messageOf(error, 'Invalid index definition'));
	}

	const ttlSeconds =
		typeof input.ttlSeconds === 'number' &&
		Number.isFinite(input.ttlSeconds) &&
		input.ttlSeconds >= 0
			? Math.trunc(input.ttlSeconds)
			: undefined;

	const result = await mongo.createIndex(database, collection, keys, {
		name: input.name?.trim() || undefined,
		unique: !!input.unique,
		sparse: !!input.sparse,
		...(ttlSeconds !== undefined ? { expireAfterSeconds: ttlSeconds } : {}),
	});
	audit({
		action: 'index.create',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		target: result.success ? result.data : input.keysJson,
		detail: result.success ? undefined : result.error,
	});
	if (!result.success) return result;
	return success({ name: result.data });
};

export const dropIndex = async (
	database: string,
	collection: string,
	indexName: string,
): Promise<ActionResult> => {
	const guard = await guardAccess({ database, collection, write: true });
	if (!guard.allowed) return failure(guard.error);
	if (indexName === '_id_') return failure('The _id index cannot be dropped');

	const result = await mongo.dropIndex(database, collection, indexName);
	audit({
		action: 'index.drop',
		actor: describeActor(guard.ctx),
		outcome: result.success ? 'success' : 'error',
		database,
		collection,
		target: indexName,
		detail: result.success ? undefined : result.error,
	});
	return result.success ? success(undefined) : result;
};
