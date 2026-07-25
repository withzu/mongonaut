export interface MongoServerInfo {
	version: string;
	host: string;
	process: string;
	pid: number;
	uptime: number;
	port?: number;
}

export interface Collection {
	name: string;
	totalSize: number | null;
	documentCount: number | null;
	canWrite?: boolean;
}

export interface Database {
	name: string;
	collections: Collection[];
	totalSize: number;
	canWrite?: boolean;
}

export interface CollectionStats {
	size: number;
	count: number;
	storageSize: number;
	avgObjSize: number;
}

export interface IndexSummary {
	name: string;
	keys: Record<string, unknown>;
	unique: boolean;
	sparse: boolean;
	ttlSeconds?: number;
	size?: number;
}

export interface DatabaseStats {
	db: string;
	collections: number;
	views: number;
	objects: number;
	avgObjSize: number;
	dataSize: number;
	storageSize: number;
	indexes: number;
	indexSize: number;
	totalSize: number;
	scaleFactor: number;
	fsUsedSize: number;
	fsTotalSize: number;
	ok: number;
}
