import { createHash } from 'node:crypto';
import { BSON, type Document } from 'mongodb';

const { EJSON } = BSON;

const MAX_ISO_MILLIS = 253402300799999;

function simplify(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(simplify);
	if (!value || typeof value !== 'object') return value;

	const entries = Object.entries(value as Record<string, unknown>);

	if (entries.length === 1) {
		const [key, inner] = entries[0];

		if (key === '$numberInt' && typeof inner === 'string') {
			const parsed = Number(inner);
			if (Number.isSafeInteger(parsed) && String(parsed) === inner) return parsed;
		}

		if (key === '$numberDouble' && typeof inner === 'string') {
			const parsed = Number(inner);
			if (Number.isFinite(parsed) && !Number.isInteger(parsed) && String(parsed) === inner) {
				return parsed;
			}
		}

		if (key === '$date' && inner && typeof inner === 'object') {
			const millisRaw = (inner as Record<string, unknown>).$numberLong;
			if (typeof millisRaw === 'string') {
				const millis = Number(millisRaw);
				if (Number.isSafeInteger(millis) && millis >= 0 && millis <= MAX_ISO_MILLIS) {
					return { $date: new Date(millis).toISOString() };
				}
			}
		}
	}

	const out: Record<string, unknown> = {};
	for (const [key, inner] of entries) out[key] = simplify(inner);
	return out;
}

export function stringifyDocumentJson(value: unknown, space: number = 0): string {
	const serialized = EJSON.serialize({ value }, { relaxed: false }) as { value: unknown };
	return JSON.stringify(simplify(serialized.value), null, space);
}

export function parseDocumentJson(text: string): unknown {
	return EJSON.parse(text, { relaxed: false });
}

export function parseDocumentJsonObject(text: string): Document {
	const parsed = parseDocumentJson(text);
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
		throw new Error('Expected a single JSON object');
	}
	return parsed as Document;
}

export function parseDocumentJsonArray(text: string): Document[] {
	const parsed = parseDocumentJson(text);
	const list = Array.isArray(parsed) ? parsed : [parsed];
	for (const entry of list) {
		if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
			throw new Error('Expected a JSON object or an array of JSON objects');
		}
	}
	return list as Document[];
}

export function stringifyDocumentId(id: unknown): string {
	return stringifyDocumentJson(id);
}

/**
 * Short fingerprint of a document as it was handed to the browser. Saving sends
 * it back so the server can tell whether somebody else wrote to the same
 * document in the meantime. BSON preserves field order, so serializing an
 * unchanged document again produces the same string and the same revision.
 */
export function documentRevision(json: string): string {
	return createHash('sha256').update(json).digest('hex').slice(0, 16);
}

export function parseDocumentId(idJson: string): unknown {
	const parsed = parseDocumentJson(idJson);
	if (parsed === undefined) throw new Error('Document id is missing');
	return parsed;
}
