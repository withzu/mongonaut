'use client';

import { useMemo, useSyncExternalStore } from 'react';
import type { Collection, Database } from '@/lib/types/mongo';

const STORAGE_KEY = 'recentCollections';
const LIMIT = 8;
const listeners = new Set<() => void>();

interface CollectionEntry {
	database: string;
	collection: Collection;
	href: string;
}

export function collectionHref(database: string, collection: string): string {
	return `/${encodeURIComponent(database)}/${encodeURIComponent(collection)}`;
}

function read(): string {
	try {
		return localStorage.getItem(STORAGE_KEY) ?? '[]';
	} catch {
		return '[]';
	}
}

function parse(raw: string): string[] {
	try {
		const parsed: unknown = JSON.parse(raw);
		return Array.isArray(parsed)
			? parsed.filter((entry): entry is string => typeof entry === 'string')
			: [];
	} catch {
		return [];
	}
}

export function rememberCollection(href: string): void {
	const next = [href, ...parse(read()).filter(entry => entry !== href)].slice(0, LIMIT);
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
	} catch {}
	listeners.forEach(listener => listener());
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

export function listCollections(databases: Database[]): CollectionEntry[] {
	return databases.flatMap(database =>
		database.collections.map(collection => ({
			database: database.name,
			collection,
			href: collectionHref(database.name, collection.name),
		})),
	);
}

export function useRecentCollections(databases: Database[]): CollectionEntry[] {
	const raw = useSyncExternalStore(subscribe, read, () => '[]');

	return useMemo(() => {
		const byHref = new Map(listCollections(databases).map(entry => [entry.href, entry]));
		return parse(raw).flatMap(href => byHref.get(href) ?? []);
	}, [databases, raw]);
}
