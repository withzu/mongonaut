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
