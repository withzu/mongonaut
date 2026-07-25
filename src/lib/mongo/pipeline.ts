import type { Document } from 'mongodb';

export interface NamespaceRef {
	database?: string;
	collection: string;
}

export interface PipelineAnalysis {
	reads: NamespaceRef[];
	writes: NamespaceRef[];
	serverJs: string[];
}

const SERVER_JS_OPERATORS = ['$where', '$function', '$accumulator'];

function namespaceRef(value: unknown): NamespaceRef | null {
	if (typeof value === 'string') {
		return value ? { collection: value } : null;
	}
	if (value && typeof value === 'object') {
		const record = value as Record<string, unknown>;
		const collection = typeof record.coll === 'string' ? record.coll : undefined;
		const database = typeof record.db === 'string' ? record.db : undefined;
		if (collection) return { collection, database };
	}
	return null;
}

class Collector {
	readonly reads = new Map<string, NamespaceRef>();
	readonly writes = new Map<string, NamespaceRef>();
	readonly serverJs = new Set<string>();

	private key(ref: NamespaceRef): string {
		return `${ref.database ?? ''}.${ref.collection}`;
	}

	addRead(value: unknown): void {
		const ref = namespaceRef(value);
		if (ref) this.reads.set(this.key(ref), ref);
	}

	addWrite(value: unknown): void {
		const ref = namespaceRef(value);
		if (ref) this.writes.set(this.key(ref), ref);
	}
}

function walk(node: unknown, collector: Collector, depth: number): void {
	if (depth > 50) throw new Error('Query is nested too deeply');

	if (Array.isArray(node)) {
		for (const entry of node) walk(entry, collector, depth + 1);
		return;
	}
	if (!node || typeof node !== 'object') return;

	for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
		if (SERVER_JS_OPERATORS.includes(key)) {
			collector.serverJs.add(key);
		}

		switch (key) {
			case '$lookup':
			case '$graphLookup':
				if (value && typeof value === 'object') {
					collector.addRead((value as Record<string, unknown>).from);
				}
				break;
			case '$unionWith':
				collector.addRead(value);
				break;
			case '$out':
				collector.addWrite(value);
				break;
			case '$merge':
				if (value && typeof value === 'object' && 'into' in (value as Record<string, unknown>)) {
					collector.addWrite((value as Record<string, unknown>).into);
				} else {
					collector.addWrite(value);
				}
				break;
		}

		walk(value, collector, depth + 1);
	}
}

export function analyzePipeline(pipeline: Document[]): PipelineAnalysis {
	const collector = new Collector();
	walk(pipeline, collector, 0);
	return {
		reads: [...collector.reads.values()],
		writes: [...collector.writes.values()],
		serverJs: [...collector.serverJs],
	};
}

export function findServerJsOperators(value: unknown): string[] {
	const collector = new Collector();
	walk(value, collector, 0);
	return [...collector.serverJs];
}

export function hasWriteStage(analysis: PipelineAnalysis): boolean {
	return analysis.writes.length > 0;
}
