import 'server-only';

import { cookies } from 'next/headers';
import { getAuthConfig } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE, type SessionPayload } from '@/lib/auth/session';
import { findAccountById, INTERNAL_DB, type AccountDoc, type Grant } from '@/lib/auth/accounts';
import { envBool } from '@/lib/env';
import type { AuthMode } from '@/lib/auth/config';

const MONGO_SYSTEM_DBS = ['admin', 'local', 'config'];

export function isInternalDb(name: string): boolean {
	return name === INTERNAL_DB;
}

export function isHiddenDb(name: string): boolean {
	return isInternalDb(name) || MONGO_SYSTEM_DBS.includes(name);
}

export interface AccessContext {
	mode: AuthMode;
	authenticated: boolean;
	account: AccountDoc | null;
}

async function loadValidAccount(session: SessionPayload): Promise<AccountDoc | null> {
	if (session.mode !== 'ACCOUNT') return null;
	if (session.recovery) return null;
	const account = await findAccountById(session.sub);
	if (!account || account.disabled) return null;
	if (account.tokenVersion !== (session.ver ?? -1)) return null;
	return account;
}

export async function getSession(): Promise<SessionPayload | null> {
	const cfg = getAuthConfig();
	if (cfg.mode === 'NONE' || !cfg.secret) return null;
	const token = (await cookies()).get(SESSION_COOKIE)?.value;
	return readSessionToken(cfg.secret, token);
}

export async function getCurrentAccount(): Promise<AccountDoc | null> {
	const cfg = getAuthConfig();
	if (cfg.mode !== 'ACCOUNT' || !cfg.secret) return null;
	const session = await getSession();
	if (!session) return null;
	return loadValidAccount(session);
}

export async function getAccessContext(): Promise<AccessContext> {
	const cfg = getAuthConfig();
	if (cfg.mode === 'NONE') return { mode: 'NONE', authenticated: false, account: null };
	if (!cfg.secret) return { mode: cfg.mode, authenticated: false, account: null };

	const session = await getSession();
	if (!session) return { mode: cfg.mode, authenticated: false, account: null };

	if (cfg.mode === 'ACCOUNT') {
		const account = await loadValidAccount(session);
		return { mode: 'ACCOUNT', authenticated: !!account, account };
	}
	return { mode: cfg.mode, authenticated: true, account: null };
}

function grantAllows(
	grants: Grant[],
	database: string,
	collection: string | undefined,
	write: boolean,
): boolean {
	return grants.some(grant => {
		if (grant.database !== database) return false;
		if (write && grant.access !== 'readWrite') return false;
		if (collection === undefined) {
			return write ? grant.collection === '*' : true;
		}
		return grant.collection === '*' || grant.collection === collection;
	});
}

export interface AccessRequest {
	database?: string;
	collection?: string;
	write?: boolean;
}

export function accessAllowed(ctx: AccessContext, req: AccessRequest): boolean {
	if (req.database && isHiddenDb(req.database)) return false;

	switch (ctx.mode) {
		case 'NONE':
			return true;
		case 'STATIC_PASSWORD':
		case 'OIDC':
			return ctx.authenticated;
		case 'ACCOUNT': {
			if (!ctx.account) return false;
			if (ctx.account.isAdmin) return true;
			if (!req.database) return true;
			return grantAllows(ctx.account.grants, req.database, req.collection, !!req.write);
		}
		default:
			return false;
	}
}

export async function guardAccess(
	req: AccessRequest,
): Promise<{ success: false; error: Error } | null> {
	const ctx = await getAccessContext();
	if (accessAllowed(ctx, req)) return null;
	return { success: false, error: new Error('Access denied') };
}

export async function requireAdmin(): Promise<{ success: false; error: Error } | null> {
	const ctx = await getAccessContext();
	if (ctx.mode === 'ACCOUNT' && ctx.account?.isAdmin) return null;
	return { success: false, error: new Error('Administrator access required') };
}

export interface ResourcePermissions {
	canRead: boolean;
	canWrite: boolean;
}

export async function getResourcePermissions(
	database: string,
	collection?: string,
): Promise<ResourcePermissions> {
	const ctx = await getAccessContext();
	const globalReadonly = envBool('MONGONAUT_READONLY', false);
	return {
		canRead: accessAllowed(ctx, { database, collection, write: false }),
		canWrite: !globalReadonly && accessAllowed(ctx, { database, collection, write: true }),
	};
}

export function canReadDatabase(ctx: AccessContext, database: string): boolean {
	return accessAllowed(ctx, { database, write: false });
}

export function canReadCollection(
	ctx: AccessContext,
	database: string,
	collection: string,
): boolean {
	return accessAllowed(ctx, { database, collection, write: false });
}

export function canWriteResource(
	ctx: AccessContext,
	database: string,
	collection?: string,
): boolean {
	if (envBool('MONGONAUT_READONLY', false)) return false;
	return accessAllowed(ctx, { database, collection, write: true });
}

interface AggregationTargets {
	reads: string[];
	writes: string[];
}

function collectAggregationTargets(pipeline: unknown[]): AggregationTargets {
	const reads = new Set<string>();
	const writes = new Set<string>();
	const collName = (value: unknown): string | null => {
		if (typeof value === 'string') return value;
		if (value && typeof value === 'object') {
			const coll = (value as { coll?: unknown }).coll ?? (value as { into?: unknown }).into;
			if (typeof coll === 'string') return coll;
		}
		return null;
	};

	for (const stage of pipeline) {
		if (!stage || typeof stage !== 'object') continue;
		for (const [op, val] of Object.entries(stage as Record<string, unknown>)) {
			switch (op) {
				case '$lookup':
				case '$graphLookup': {
					const from = (val as { from?: unknown })?.from;
					if (typeof from === 'string') reads.add(from);
					break;
				}
				case '$unionWith': {
					const name = collName(val);
					if (name) reads.add(name);
					break;
				}
				case '$out': {
					const name = collName(val);
					if (name) writes.add(name);
					break;
				}
				case '$merge': {
					const into = (val as { into?: unknown })?.into ?? val;
					const name = collName(into);
					if (name) writes.add(name);
					break;
				}
			}
		}
	}
	return { reads: [...reads], writes: [...writes] };
}

export async function guardAggregation(
	database: string,
	collection: string,
	pipeline: unknown[],
): Promise<{ success: false; error: Error } | null> {
	const ctx = await getAccessContext();

	if (!accessAllowed(ctx, { database, collection, write: false })) {
		return { success: false, error: new Error('Access denied') };
	}

	const { reads, writes } = collectAggregationTargets(pipeline);

	for (const target of reads) {
		if (!accessAllowed(ctx, { database, collection: target, write: false })) {
			return {
				success: false,
				error: new Error(`Access denied: no read permission for "${target}"`),
			};
		}
	}

	for (const target of writes) {
		if (!accessAllowed(ctx, { database, collection: target, write: true })) {
			return {
				success: false,
				error: new Error(`Access denied: aggregation write to "${target}" not permitted`),
			};
		}
	}

	return null;
}
