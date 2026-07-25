import 'server-only';

import { cookies } from 'next/headers';
import type { Document } from 'mongodb';
import { getAuthConfig } from '@/lib/auth/config';
import { readSessionToken, SESSION_COOKIE, type SessionPayload } from '@/lib/auth/session';
import { findAccountById, INTERNAL_DB, type AccountDoc, type Grant } from '@/lib/auth/accounts';
import { envBool } from '@/lib/env';
import { analyzePipeline, hasWriteStage, type PipelineAnalysis } from '@/lib/mongo/pipeline';
import type { AuthMode } from '@/lib/auth/config';

const MONGO_SYSTEM_DBS = ['admin', 'local', 'config'];

export const READONLY_MESSAGE = 'Mongonaut is running in read-only mode';
export const DENIED_MESSAGE = 'Access denied';
export const ADMIN_MESSAGE = 'Administrator access required';

export function isInternalDb(name: string): boolean {
	return name === INTERNAL_DB;
}

export function isHiddenDb(name: string): boolean {
	return isInternalDb(name) || MONGO_SYSTEM_DBS.includes(name);
}

export function isGlobalReadonly(): boolean {
	return envBool('MONGONAUT_READONLY', false);
}

export function isServerJsAllowed(): boolean {
	return envBool('MONGONAUT_ALLOW_SERVER_JS', false);
}

export interface AccessContext {
	mode: AuthMode;
	authenticated: boolean;
	account: AccountDoc | null;
}

export type GuardFailure = { allowed: false; error: string };
export type GuardResult = { allowed: true; ctx: AccessContext } | GuardFailure;

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

export function describeActor(ctx: AccessContext): string {
	switch (ctx.mode) {
		case 'ACCOUNT':
			return ctx.account ? `account:${ctx.account.email}` : 'account:unauthenticated';
		case 'STATIC_PASSWORD':
			return ctx.authenticated ? 'static-password' : 'unauthenticated';
		case 'OIDC':
			return ctx.authenticated ? 'oidc' : 'unauthenticated';
		default:
			return 'auth-disabled';
	}
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
	// Global read-only mode outranks every grant, in every auth mode.
	if (req.write && isGlobalReadonly()) return false;

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

export async function guardAccess(req: AccessRequest): Promise<GuardResult> {
	const ctx = await getAccessContext();
	// Checked before the grant lookup so the user sees the actual reason.
	if (req.write && isGlobalReadonly()) return { allowed: false, error: READONLY_MESSAGE };
	if (!accessAllowed(ctx, req)) return { allowed: false, error: DENIED_MESSAGE };
	return { allowed: true, ctx };
}

export async function requireAdmin(): Promise<GuardResult> {
	const ctx = await getAccessContext();
	if (ctx.mode === 'ACCOUNT' && ctx.account?.isAdmin) return { allowed: true, ctx };
	return { allowed: false, error: ADMIN_MESSAGE };
}

// Instance-wide operations such as creating or dropping a database. Only ACCOUNT
// mode knows the difference between administrators and regular users, so every
// other mode grants this to whoever got through the front door.
export function canAdministerInstance(ctx: AccessContext): boolean {
	switch (ctx.mode) {
		case 'NONE':
			return true;
		case 'ACCOUNT':
			return !!ctx.account?.isAdmin;
		default:
			return ctx.authenticated;
	}
}

export async function requireInstanceAdmin(): Promise<GuardResult> {
	const ctx = await getAccessContext();
	if (canAdministerInstance(ctx)) return { allowed: true, ctx };
	return { allowed: false, error: ctx.mode === 'ACCOUNT' ? ADMIN_MESSAGE : DENIED_MESSAGE };
}

export async function requireAnyAccess(): Promise<GuardResult> {
	const ctx = await getAccessContext();
	if (!accessAllowed(ctx, {})) return { allowed: false, error: DENIED_MESSAGE };
	if (ctx.mode === 'ACCOUNT' && ctx.account && !ctx.account.isAdmin) {
		if (ctx.account.grants.length === 0) return { allowed: false, error: DENIED_MESSAGE };
	}
	return { allowed: true, ctx };
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
	return {
		canRead: accessAllowed(ctx, { database, collection, write: false }),
		canWrite: accessAllowed(ctx, { database, collection, write: true }),
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
	return accessAllowed(ctx, { database, collection, write: true });
}

export type AggregationGuardResult =
	{ allowed: true; ctx: AccessContext; hasWriteStage: boolean } | GuardFailure;

export async function guardAggregation(
	database: string,
	collection: string,
	pipeline: Document[],
): Promise<AggregationGuardResult> {
	const ctx = await getAccessContext();

	if (!accessAllowed(ctx, { database, collection, write: false })) {
		return { allowed: false, error: DENIED_MESSAGE };
	}

	let analysis: PipelineAnalysis;
	try {
		analysis = analyzePipeline(pipeline);
	} catch (error) {
		return { allowed: false, error: error instanceof Error ? error.message : 'Invalid pipeline' };
	}

	if (analysis.serverJs.length > 0 && !isServerJsAllowed()) {
		return { allowed: false, error: serverJsMessage(analysis.serverJs) };
	}

	for (const target of analysis.reads) {
		const targetDb = target.database ?? database;
		if (!accessAllowed(ctx, { database: targetDb, collection: target.collection, write: false })) {
			return {
				allowed: false,
				error: `Access denied: no read permission for "${targetDb}.${target.collection}"`,
			};
		}
	}

	for (const target of analysis.writes) {
		if (isGlobalReadonly()) return { allowed: false, error: READONLY_MESSAGE };
		const targetDb = target.database ?? database;
		if (!accessAllowed(ctx, { database: targetDb, collection: target.collection, write: true })) {
			return {
				allowed: false,
				error: `Access denied: aggregation write to "${targetDb}.${target.collection}" not permitted`,
			};
		}
	}

	return { allowed: true, ctx, hasWriteStage: hasWriteStage(analysis) };
}

export function serverJsMessage(operators: string[]): string {
	return `${operators.join(', ')} executes JavaScript inside MongoDB and is disabled. Set MONGONAUT_ALLOW_SERVER_JS=true to allow it.`;
}
