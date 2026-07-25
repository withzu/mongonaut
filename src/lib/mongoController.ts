import {
	Document,
	Filter,
	IndexSpecification,
	MongoClient,
	MongoError,
	MongoServerError,
	Sort,
} from 'mongodb';
import { CollectionStats, IndexSummary } from '@/lib/types/mongo';
import { env, envInt } from '@/lib/env';
import { MongoConnectionError } from '@/lib/errors/mongo';

export type ControllerResult<T> = { success: true; data: T } | { success: false; error: string };

export interface PaginatedDocuments {
	documents: Document[];
	page: number;
	pageSize: number;
	total: number | null;
	totalPages: number | null;
	hasMore: boolean;
}

export interface CollectionSummary {
	name: string;
	type?: string;
}

export type { IndexSummary };

function ok<T>(data: T): ControllerResult<T> {
	return { success: true, data };
}

function fail(error: unknown, fallback: string): ControllerResult<never> {
	if (error instanceof Error && error.message) return { success: false, error: error.message };
	return { success: false, error: fallback };
}

export function validateDatabaseName(name: string): string | null {
	if (!name.trim()) return 'Please enter a database name';
	if (name.length > 63) return 'Database names may be at most 63 characters long';
	if (/[/\\. "$*<>:|?\0]/.test(name)) {
		return 'Database names may not contain / \\ . " $ * < > : | ? or spaces';
	}
	return null;
}

export function validateCollectionName(name: string): string | null {
	if (!name.trim()) return 'Please enter a collection name';
	if (Buffer.byteLength(name, 'utf8') > 235)
		return 'Collection names may be at most 235 bytes long';
	if (name.startsWith('system.')) return 'Collection names may not start with "system."';
	if (name.includes('$') || name.includes('\0')) {
		return 'Collection names may not contain $ or null characters';
	}
	return null;
}

export class MongoController {
	readonly client: MongoClient;
	private connected: boolean = false;
	private readonly TIMEOUT = envInt('MONGONAUT_TIMEOUT', 5000, { min: 250 });
	private readonly QUERY_TIMEOUT = envInt('MONGONAUT_QUERY_TIMEOUT', 15000, { min: 1000 });

	constructor() {
		this.client = new MongoClient(env('MONGO_CONNECTION_URL', 'mongodb://localhost:27017'), {
			serverSelectionTimeoutMS: this.TIMEOUT,
			connectTimeoutMS: this.TIMEOUT,
		});
	}

	private get queryOptions() {
		return { maxTimeMS: this.QUERY_TIMEOUT };
	}

	private get documentReadOptions() {
		return { maxTimeMS: this.QUERY_TIMEOUT, promoteValues: false, promoteLongs: false };
	}

	private async connect(): Promise<ControllerResult<undefined>> {
		if (this.connected) return ok(undefined);

		let timer: ReturnType<typeof setTimeout> | undefined;
		try {
			await Promise.race([
				this.client.connect(),
				new Promise((_, reject) => {
					timer = setTimeout(
						() => reject(new MongoConnectionError('Connection timeout')),
						this.TIMEOUT,
					);
				}),
			]);
			this.connected = true;
			return ok(undefined);
		} catch (error) {
			this.connected = false;
			return { success: false, error: describeConnectionError(error) };
		} finally {
			if (timer) clearTimeout(timer);
		}
	}

	private async run<T>(
		fallback: string,
		operation: () => Promise<T>,
	): Promise<ControllerResult<T>> {
		const connection = await this.connect();
		if (!connection.success) return connection;
		try {
			return ok(await operation());
		} catch (error) {
			if (isConnectionError(error)) {
				this.connected = false;
				return { success: false, error: describeConnectionError(error) };
			}
			return fail(error, fallback);
		}
	}

	// SERVER
	public async getServerInfo(): Promise<ControllerResult<Document>> {
		return this.run('Could not read server information', () =>
			this.client.db().admin().serverInfo(),
		);
	}

	// DATABASE
	public async listDatabases(): Promise<
		ControllerResult<{ databases: { name: string; sizeOnDisk?: number }[] }>
	> {
		return this.run('Could not list databases', async () => {
			const result = await this.client.db().admin().listDatabases();
			return { databases: result.databases ?? [] };
		});
	}

	public async dropDatabase(dbName: string): Promise<ControllerResult<undefined>> {
		return this.run('Could not drop the database', async () => {
			await this.client.db(dbName).dropDatabase();
			return undefined;
		});
	}

	// COLLECTION
	public async getDatabaseCollections(
		name: string,
	): Promise<ControllerResult<CollectionSummary[]>> {
		return this.run('Could not list collections', async () => {
			const collections = await this.client.db(name).listCollections().toArray();
			return collections.map(entry => ({ name: entry.name, type: entry.type }));
		});
	}

	public async collectionExists(
		dbName: string,
		collectionName: string,
	): Promise<ControllerResult<boolean>> {
		return this.run('Could not check the collection', async () => {
			const matches = await this.client
				.db(dbName)
				.listCollections({ name: collectionName }, { nameOnly: true })
				.toArray();
			return matches.length > 0;
		});
	}

	public async getCollectionStats(
		dbName: string,
		collectionName: string,
	): Promise<ControllerResult<CollectionStats>> {
		return this.run('Could not read collection statistics', async () => {
			try {
				const result = await this.client
					.db(dbName)
					.collection(collectionName)
					.aggregate([{ $collStats: { storageStats: {} } }], this.queryOptions)
					.toArray();
				const storage = (result[0]?.storageStats ?? {}) as Partial<CollectionStats>;
				return {
					size: storage.size ?? 0,
					count: storage.count ?? 0,
					storageSize: storage.storageSize ?? 0,
					avgObjSize: storage.avgObjSize ?? 0,
				};
			} catch {
				return { size: 0, count: 0, storageSize: 0, avgObjSize: 0 };
			}
		});
	}

	public async createCollection(
		dbName: string,
		collectionName: string,
	): Promise<ControllerResult<undefined>> {
		return this.run('Could not create the collection', async () => {
			await this.client.db(dbName).createCollection(collectionName);
			return undefined;
		});
	}

	public async dropCollection(
		dbName: string,
		collectionName: string,
	): Promise<ControllerResult<undefined>> {
		return this.run('Could not drop the collection', async () => {
			await this.client.db(dbName).collection(collectionName).drop();
			return undefined;
		});
	}

	public async renameCollection(
		dbName: string,
		collectionName: string,
		newName: string,
	): Promise<ControllerResult<undefined>> {
		return this.run('Could not rename the collection', async () => {
			await this.client.db(dbName).renameCollection(collectionName, newName);
			return undefined;
		});
	}

	public async duplicateCollection(
		dbName: string,
		sourceName: string,
		targetName: string,
	): Promise<ControllerResult<undefined>> {
		return this.run('Could not duplicate the collection', async () => {
			const db = this.client.db(dbName);
			const source = db.collection(sourceName);

			await source.aggregate([{ $match: {} }, { $out: targetName }]).toArray();

			const indexes = await source.listIndexes().toArray();
			const target = db.collection(targetName);
			for (const index of indexes) {
				if (index.name === '_id_') continue;
				const { key, name, v, ...options } = index;
				void v;
				try {
					await target.createIndex(key, { name, ...options });
				} catch (indexError) {
					console.warn(`Could not recreate index ${name} on ${targetName}:`, indexError);
				}
			}
			return undefined;
		});
	}

	// INDEXES
	public async listIndexes(
		dbName: string,
		collectionName: string,
	): Promise<ControllerResult<IndexSummary[]>> {
		return this.run('Could not list indexes', async () => {
			const collection = this.client.db(dbName).collection(collectionName);
			const indexes = await collection.listIndexes().toArray();

			let sizes: Record<string, number> = {};
			try {
				const stats = await collection
					.aggregate([{ $collStats: { storageStats: {} } }], this.queryOptions)
					.toArray();
				sizes = (stats[0]?.storageStats?.indexSizes ?? {}) as Record<string, number>;
			} catch {
				sizes = {};
			}

			return indexes.map(index => ({
				name: String(index.name),
				keys: index.key as Record<string, unknown>,
				unique: !!index.unique,
				sparse: !!index.sparse,
				ttlSeconds:
					typeof index.expireAfterSeconds === 'number' ? index.expireAfterSeconds : undefined,
				size: sizes[String(index.name)],
			}));
		});
	}

	public async createIndex(
		dbName: string,
		collectionName: string,
		keys: IndexSpecification,
		options: { name?: string; unique?: boolean; sparse?: boolean; expireAfterSeconds?: number },
	): Promise<ControllerResult<string>> {
		return this.run('Could not create the index', () =>
			this.client.db(dbName).collection(collectionName).createIndex(keys, options),
		);
	}

	public async dropIndex(
		dbName: string,
		collectionName: string,
		indexName: string,
	): Promise<ControllerResult<undefined>> {
		return this.run('Could not drop the index', async () => {
			await this.client.db(dbName).collection(collectionName).dropIndex(indexName);
			return undefined;
		});
	}

	// DOCUMENTS
	public async browseDocuments(
		dbName: string,
		collectionName: string,
		page: number,
		pageSize: number,
	): Promise<ControllerResult<PaginatedDocuments>> {
		return this.run('Could not read the collection', async () => {
			const collection = this.client.db(dbName).collection(collectionName);
			// An estimate keeps browsing cheap on large collections; exact counts are
			// only used for filtered queries where the filter bounds the scan.
			const total = await collection.estimatedDocumentCount(this.queryOptions);
			const documents = await collection
				.find({}, this.documentReadOptions)
				.skip((page - 1) * pageSize)
				.limit(pageSize + 1)
				.toArray();
			return paginate(documents, page, pageSize, total);
		});
	}

	public async findDocuments(
		dbName: string,
		collectionName: string,
		filter: Filter<Document>,
		sort: Sort,
		page: number,
		pageSize: number,
	): Promise<ControllerResult<PaginatedDocuments>> {
		return this.run('Could not run the query', async () => {
			const collection = this.client.db(dbName).collection(collectionName);
			const total = await collection.countDocuments(filter, this.queryOptions);
			const cursor = collection.find(filter, this.documentReadOptions);
			if (sort && Object.keys(sort).length > 0) cursor.sort(sort);
			const documents = await cursor
				.skip((page - 1) * pageSize)
				.limit(pageSize + 1)
				.toArray();
			return paginate(documents, page, pageSize, total);
		});
	}

	public async aggregateDocuments(
		dbName: string,
		collectionName: string,
		pipeline: Document[],
		page: number,
		pageSize: number,
		isWritePipeline: boolean,
	): Promise<ControllerResult<PaginatedDocuments>> {
		return this.run('Could not run the aggregation', async () => {
			const collection = this.client.db(dbName).collection(collectionName);

			if (isWritePipeline) {
				await collection.aggregate(pipeline, this.documentReadOptions).toArray();
				return paginate([], 1, pageSize, 0);
			}

			const documents = await collection
				.aggregate(
					[...pipeline, { $skip: (page - 1) * pageSize }, { $limit: pageSize + 1 }],
					this.documentReadOptions,
				)
				.toArray();
			return paginate(documents, page, pageSize, null);
		});
	}

	public async exportDocuments(
		dbName: string,
		collectionName: string,
		limit: number,
	): Promise<ControllerResult<{ documents: Document[]; truncated: boolean }>> {
		return this.run('Could not read the documents', async () => {
			const documents = await this.client
				.db(dbName)
				.collection(collectionName)
				.find({}, this.documentReadOptions)
				.limit(limit + 1)
				.toArray();
			const truncated = documents.length > limit;
			if (truncated) documents.pop();
			return { documents, truncated };
		});
	}

	public async insertDocuments(
		dbName: string,
		collectionName: string,
		documents: Document[],
	): Promise<ControllerResult<{ insertedCount: number; insertedId: unknown }>> {
		return this.run('Could not insert the documents', async () => {
			const collection = this.client.db(dbName).collection(collectionName);
			if (documents.length === 1) {
				const result = await collection.insertOne(documents[0]);
				return { insertedCount: 1, insertedId: result.insertedId };
			}
			const result = await collection.insertMany(documents, { ordered: false });
			return { insertedCount: result.insertedCount, insertedId: null };
		});
	}

	public async replaceDocument(
		dbName: string,
		collectionName: string,
		documentId: unknown,
		replacement: Document,
	): Promise<ControllerResult<{ matched: number; modified: number }>> {
		return this.run('Could not update the document', async () => {
			const { _id, ...withoutId } = replacement;
			void _id;
			const result = await this.client
				.db(dbName)
				.collection(collectionName)
				.replaceOne({ _id: documentId } as Filter<Document>, withoutId);
			return { matched: result.matchedCount, modified: result.modifiedCount };
		});
	}

	public async deleteDocument(
		dbName: string,
		collectionName: string,
		documentId: unknown,
	): Promise<ControllerResult<{ deleted: number }>> {
		return this.run('Could not delete the document', async () => {
			const result = await this.client
				.db(dbName)
				.collection(collectionName)
				.deleteOne({ _id: documentId } as Filter<Document>);
			return { deleted: result.deletedCount };
		});
	}

	public async deleteAllDocuments(
		dbName: string,
		collectionName: string,
	): Promise<ControllerResult<{ deletedCount: number }>> {
		return this.run('Could not delete the documents', async () => {
			const result = await this.client.db(dbName).collection(collectionName).deleteMany({});
			return { deletedCount: result.deletedCount };
		});
	}

	public async ensureConnection() {
		return this.connect();
	}
}

function paginate(
	documents: Document[],
	page: number,
	pageSize: number,
	total: number | null,
): PaginatedDocuments {
	const hasMore = documents.length > pageSize;
	if (hasMore) documents.pop();
	return {
		documents,
		page,
		pageSize,
		total,
		totalPages: total === null ? null : Math.max(1, Math.ceil(total / pageSize)),
		hasMore,
	};
}

function isConnectionError(error: unknown): boolean {
	if (error instanceof MongoConnectionError) return true;
	if (error instanceof MongoServerError) return false;
	if (error instanceof MongoError) {
		return /topology|server selection|connect|socket|ECONNREFUSED|ENOTFOUND/i.test(error.message);
	}
	return false;
}

function describeConnectionError(error: unknown): string {
	if (error instanceof MongoError) {
		switch (error.code) {
			case 18:
				return 'Invalid MongoDB credentials';
			case 93:
				return 'Invalid MongoDB connection URL';
		}
	}
	if (error instanceof Error) {
		if (error.message.includes('ECONNREFUSED'))
			return 'MongoDB is not reachable (connection refused)';
		if (error.message.includes('ENOTFOUND')) return 'MongoDB host could not be resolved';
		if (/timed? ?out/i.test(error.message)) return 'Connection to MongoDB timed out';
		if (error.message) return `Could not connect to MongoDB: ${error.message}`;
	}
	return 'Could not connect to MongoDB';
}

let sharedController: MongoController | null = null;

export function getMongoController(): MongoController {
	if (!sharedController) {
		sharedController = new MongoController();
	}
	return sharedController;
}
