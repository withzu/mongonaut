'use server';

import { BSON, type Document, type Filter, type Sort } from 'mongodb';

const { EJSON } = BSON;
import { getMongoController } from '@/lib/mongoController';
import { Database, MongoDocument } from '@/lib/types/mongo';
import { envBool } from '@/lib/env';
import {
	canReadCollection,
	canReadDatabase,
	canWriteResource,
	getAccessContext,
	guardAccess,
	guardAggregation,
	isHiddenDb,
	requireAdmin,
} from '@/lib/auth/server';
import { INTERNAL_DB } from '@/lib/auth/accounts';

const mongo = getMongoController();

function assertWritable(): { success: false; error: Error } | null {
	if (envBool('MONGONAUT_READONLY', false)) {
		return { success: false, error: new Error('Mongonaut is running in read-only mode') };
	}
	return null;
}

export const getServerInfo = async () => {
	const guard = await guardAccess({});
	if (guard) return guard;
	return await mongo.getServerInfo();
};

export const getViewerInfo = async () => {
	const ctx = await getAccessContext();
	const isAccountAdmin = ctx.mode === 'ACCOUNT' && !!ctx.account?.isAdmin;
	return {
		isAccountAdmin,
		canCreateDatabase: ctx.mode === 'ACCOUNT' ? isAccountAdmin : true,
		globalReadonly: envBool('MONGONAUT_READONLY', false),
		mode: ctx.mode,
	};
};

export const listDatabases = async () => {
	const result = await mongo.listDatabases();
	if (!result.success || !result.data) return result;

	const ctx = await getAccessContext();
	const databases = (result.data.databases || []).filter(
		(db: { name: string }) => !isHiddenDb(db.name) && canReadDatabase(ctx, db.name),
	);
	const totalSize = databases.reduce(
		(sum: number, db: { sizeOnDisk?: number }) => sum + (db.sizeOnDisk || 0),
		0,
	);

	return { ...result, data: { ...result.data, databases, totalSize } };
};

export const collectSidebarDatabaseInformation = async () => {
	const databasesResult = await mongo.listDatabases();
	if (!databasesResult.success) {
		return { success: false, error: databasesResult.error };
	}

	if (!databasesResult.data) {
		return { success: false, error: new Error('No database data available') };
	}

	const databasesList = databasesResult.data.databases || [];
	const collectedDatabaseData: Database[] = [];
	const ctx = await getAccessContext();

	for (const database of databasesList) {
		if (isHiddenDb(database.name) || !canReadDatabase(ctx, database.name)) {
			continue;
		}

		try {
			const collectionsResult = await mongo.getDatabaseCollections(database.name);
			if (!collectionsResult.success || !collectionsResult.data) {
				console.warn(`Could not get collections for database ${database.name}`);
				continue;
			}

			const collections = (await collectionsResult.data.toArray()).filter(
				col => col.name !== '__mongonaut_init' && canReadCollection(ctx, database.name, col.name),
			);

			const collectionsWithStats = await Promise.all(
				collections.map(async col => {
					const canWrite = canWriteResource(ctx, database.name, col.name);
					try {
						const statsResult = await mongo.getCollectionStats(database.name, col.name);
						if (!statsResult.success || !statsResult.data) {
							console.warn(`Could not get stats for collection ${col.name}`);
							return {
								name: col.name,
								totalSize: 0,
								documentCount: 0,
								canWrite,
							};
						}

						const stats = statsResult.data;
						return {
							name: col.name,
							totalSize: stats.size || 0,
							documentCount: stats.count || 0,
							canWrite,
						};
					} catch (error) {
						console.error(`Error getting stats for ${col.name}:`, error);
						return {
							name: col.name,
							totalSize: 0,
							documentCount: 0,
						};
					}
				}),
			);

			collectedDatabaseData.push({
				name: database.name,
				collections: collectionsWithStats,
				totalSize: database.sizeOnDisk || 0,
				canWrite: canWriteResource(ctx, database.name),
			});
		} catch (error) {
			console.error(`Error processing database ${database.name}:`, error);
			continue;
		}
	}

	return { success: true, data: collectedDatabaseData };
};

export const getDatabaseCollection = async (name: string) => {
	const guard = await guardAccess({ database: name });
	if (guard) return undefined;

	const result = await mongo.getDatabaseCollections(name);
	if (!result.data) return result.data;

	const ctx = await getAccessContext();
	const collections = (await result.data.toArray()).filter(
		col => col.name !== '__mongonaut_init' && canReadCollection(ctx, name, col.name),
	);
	return collections;
};

export const getDatabaseCollectionStats = async (database: string, collection: string) => {
	const guard = await guardAccess({ database, collection });
	if (guard) return undefined;

	const result = await mongo.getCollectionStats(database, collection);
	return result.data;
};

export const isDatabaseCollectionExisting = async (database: string, collection: string) => {
	const ctx = await getAccessContext();
	if (!canReadCollection(ctx, database, collection)) return false;

	const result = await mongo.isCollectionExisting(database, collection);
	return result.exists;
};

export const getDatabaseCollectionContent = async (
	database: string,
	collection: string,
	page: number = 1,
	pageSize: number = 10,
) => {
	const guard = await guardAccess({ database, collection });
	if (guard) return { documents: [], pagination: emptyPagination(pageSize) };

	const result = await mongo.getCollectionContent(database, collection, page, pageSize);

	return {
		documents: result.documents,
		pagination: result.pagination,
	};
};

export const getDatabaseCollectionAllDocumentsJson = async (
	database: string,
	collection: string,
) => {
	const guard = await guardAccess({ database, collection });
	if (guard) return { ...guard, json: '[]' };

	const result = await mongo.getAllDocuments(database, collection);

	return {
		success: result.success,
		json: result.documents ? JSON.stringify(result.documents, null, 2) : '[]',
		error: result.error,
	};
};

const emptyPagination = (pageSize: number) => ({
	total: 0,
	page: 1,
	pageSize,
	totalPages: 0,
});

export const findInCollection = async (
	database: string,
	collection: string,
	filterJson: string,
	sortJson: string,
	page: number = 1,
	pageSize: number = 10,
) => {
	const guard = await guardAccess({ database, collection });
	if (guard) return { ...guard, documents: [], pagination: emptyPagination(pageSize) };

	let filter: Filter<Document>;
	let sort: Sort;
	try {
		filter = filterJson ? (EJSON.parse(filterJson, { relaxed: true }) as Filter<Document>) : {};
		sort = sortJson ? (EJSON.parse(sortJson, { relaxed: true }) as Sort) : {};
	} catch (error) {
		return {
			success: false,
			documents: [],
			pagination: emptyPagination(pageSize),
			error: error instanceof Error ? error : new Error('Invalid query JSON'),
		};
	}

	const result = await mongo.findInCollection(database, collection, filter, sort, page, pageSize);

	return {
		success: result.success,
		documents: result.documents,
		pagination: result.pagination,
		error: result.error,
	};
};

export const aggregateInCollection = async (
	database: string,
	collection: string,
	pipelineJson: string,
	page: number = 1,
	pageSize: number = 10,
) => {
	let pipeline: Document[];
	try {
		const parsed = EJSON.parse(pipelineJson, { relaxed: true });
		if (!Array.isArray(parsed)) {
			throw new Error('Aggregation pipeline must be a JSON array');
		}
		pipeline = parsed as Document[];
	} catch (error) {
		return {
			success: false,
			documents: [],
			pagination: emptyPagination(pageSize),
			error: error instanceof Error ? error : new Error('Invalid pipeline JSON'),
		};
	}

	const guard = await guardAggregation(database, collection, pipeline);
	if (guard) return { ...guard, documents: [], pagination: emptyPagination(pageSize) };

	const result = await mongo.aggregateInCollection(database, collection, pipeline, page, pageSize);

	return {
		success: result.success,
		documents: result.documents,
		pagination: result.pagination,
		error: result.error,
	};
};

export const deleteDocument = async (database: string, collection: string, documentId: string) => {
	const guard = assertWritable();
	if (guard) return { ...guard, deleted: false };
	const access = await guardAccess({ database, collection, write: true });
	if (access) return { ...access, deleted: false };

	const result = await mongo.deleteDocument(database, collection, documentId);

	return {
		success: result.success,
		deleted: result.deleted || false,
		error: result.error,
	};
};

export const deleteAllDocuments = async (database: string, collection: string) => {
	const guard = assertWritable();
	if (guard) return { ...guard, deletedCount: 0 };
	const access = await guardAccess({ database, collection, write: true });
	if (access) return { ...access, deletedCount: 0 };

	const result = await mongo.deleteAllDocuments(database, collection);

	return {
		success: result.success,
		deletedCount: result.deletedCount || 0,
		error: result.error,
	};
};

export const addDocument = async (database: string, collection: string, documentJson: string) => {
	const guard = assertWritable();
	if (guard) return { ...guard, insertedId: null };
	const access = await guardAccess({ database, collection, write: true });
	if (access) return { ...access, insertedId: null };

	try {
		const document = JSON.parse(documentJson);
		const result = await mongo.addDocument(database, collection, document);

		return {
			success: result.success,
			insertedId: result.insertedId || null,
			error: result.error,
		};
	} catch (error) {
		return {
			success: false,
			insertedId: null,
			error: error instanceof Error ? error : new Error('Invalid JSON'),
		};
	}
};

export const updateDocument = async (
	database: string,
	collection: string,
	documentId: string,
	updatedDocument: MongoDocument,
) => {
	const guard = assertWritable();
	if (guard) return { ...guard, updated: false };
	const access = await guardAccess({ database, collection, write: true });
	if (access) return { ...access, updated: false };

	const result = await mongo.updateDocument(database, collection, documentId, updatedDocument);

	return {
		success: result.success,
		updated: result.updated || false,
		error: result.error,
	};
};

export const createCollection = async (database: string, collection: string) => {
	const guard = assertWritable();
	if (guard) return guard;
	const access = await guardAccess({ database, write: true });
	if (access) return access;

	return await mongo.createCollection(database, collection);
};

export const createDatabase = async (database: string) => {
	const guard = assertWritable();
	if (guard) return guard;
	const admin = await requireAdmin();
	if (admin) return admin;
	if (isHiddenDb(database) || database === INTERNAL_DB) {
		return { success: false, error: new Error('Reserved database name') };
	}

	const dummyCollection = '__mongonaut_init';
	return await mongo.createCollection(database, dummyCollection);
};

export const dropCollection = async (database: string, collection: string) => {
	const guard = assertWritable();
	if (guard) return guard;
	const access = await guardAccess({ database, collection, write: true });
	if (access) return access;

	return await mongo.dropCollection(database, collection);
};

export const renameCollection = async (database: string, collection: string, newName: string) => {
	const guard = assertWritable();
	if (guard) return guard;
	const access = await guardAccess({ database, collection, write: true });
	if (access) return access;
	const targetAccess = await guardAccess({ database, collection: newName, write: true });
	if (targetAccess) return targetAccess;

	return await mongo.renameCollection(database, collection, newName);
};

export const duplicateCollection = async (
	database: string,
	collection: string,
	targetName: string,
) => {
	const guard = assertWritable();
	if (guard) return guard;
	const readAccess = await guardAccess({ database, collection });
	if (readAccess) return readAccess;
	const writeAccess = await guardAccess({ database, collection: targetName, write: true });
	if (writeAccess) return writeAccess;

	return await mongo.duplicateCollection(database, collection, targetName);
};

export const dropDatabase = async (database: string) => {
	const guard = assertWritable();
	if (guard) return guard;
	const admin = await requireAdmin();
	if (admin) return admin;
	if (isHiddenDb(database)) {
		return { success: false, error: new Error('Reserved database name') };
	}

	return await mongo.dropDatabase(database);
};
