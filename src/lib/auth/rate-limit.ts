import { NextRequest } from 'next/server';
import { envInt } from '@/lib/env';

interface Bucket {
	failures: number;
	firstFailureAt: number;
	lockedUntil: number | null;
}

interface RateLimitConfig {
	maxAttempts: number;
	windowMs: number;
	lockoutMs: number;
	globalMaxAttempts: number;
	globalWindowMs: number;
	trustedProxyHops: number;
}

let cachedConfig: RateLimitConfig | null = null;

function getConfig(): RateLimitConfig {
	if (cachedConfig) return cachedConfig;
	const windowSeconds = envInt('MONGONAUT_LOGIN_WINDOW_SECONDS', 15 * 60, { min: 1 });
	const lockoutSeconds = envInt('MONGONAUT_LOGIN_LOCKOUT_SECONDS', 15 * 60, { min: 1 });
	cachedConfig = {
		maxAttempts: envInt('MONGONAUT_LOGIN_MAX_ATTEMPTS', 5, { min: 1 }),
		windowMs: windowSeconds * 1000,
		lockoutMs: lockoutSeconds * 1000,
		globalMaxAttempts: envInt('MONGONAUT_LOGIN_GLOBAL_MAX_ATTEMPTS', 50, { min: 1 }),
		globalWindowMs: envInt('MONGONAUT_LOGIN_GLOBAL_WINDOW_SECONDS', 5 * 60, { min: 1 }) * 1000,
		trustedProxyHops: envInt('MONGONAUT_TRUSTED_PROXY_HOPS', 0, { min: 0, max: 10 }),
	};
	return cachedConfig;
}

const buckets = new Map<string, Bucket>();
const GLOBAL_KEY = '__global__';

let lastCleanup = 0;
function maybeCleanup(now: number) {
	if (now - lastCleanup < 60_000) return;
	lastCleanup = now;
	const cfg = getConfig();
	const idleLimit = Math.max(cfg.windowMs, cfg.lockoutMs, cfg.globalWindowMs);
	for (const [key, bucket] of buckets) {
		const expired =
			now - bucket.firstFailureAt > idleLimit && (!bucket.lockedUntil || bucket.lockedUntil <= now);
		if (expired) buckets.delete(key);
	}
}

export interface RateLimitDecision {
	allowed: boolean;
	retryAfterSeconds: number;
	remainingAttempts: number;
}

function evaluate(
	bucket: Bucket | undefined,
	now: number,
	maxAttempts: number,
	windowMs: number,
): RateLimitDecision {
	if (!bucket) return { allowed: true, retryAfterSeconds: 0, remainingAttempts: maxAttempts };
	if (bucket.lockedUntil && bucket.lockedUntil > now) {
		return {
			allowed: false,
			retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000),
			remainingAttempts: 0,
		};
	}
	if (now - bucket.firstFailureAt > windowMs) {
		return { allowed: true, retryAfterSeconds: 0, remainingAttempts: maxAttempts };
	}
	return {
		allowed: true,
		retryAfterSeconds: 0,
		remainingAttempts: Math.max(0, maxAttempts - bucket.failures),
	};
}

export function checkLoginRateLimit(clientKey: string): RateLimitDecision {
	const cfg = getConfig();
	const now = Date.now();
	maybeCleanup(now);
	const perIp = evaluate(buckets.get(clientKey), now, cfg.maxAttempts, cfg.windowMs);
	if (!perIp.allowed) return perIp;
	const global = evaluate(buckets.get(GLOBAL_KEY), now, cfg.globalMaxAttempts, cfg.globalWindowMs);
	if (!global.allowed) return global;
	return {
		allowed: true,
		retryAfterSeconds: 0,
		remainingAttempts: Math.min(perIp.remainingAttempts, global.remainingAttempts),
	};
}

function bumpBucket(
	key: string,
	now: number,
	maxAttempts: number,
	windowMs: number,
	lockoutMs: number,
) {
	let bucket = buckets.get(key);
	const expired =
		!bucket ||
		(bucket.lockedUntil && bucket.lockedUntil <= now) ||
		now - bucket.firstFailureAt > windowMs;
	if (expired) {
		bucket = { failures: 0, firstFailureAt: now, lockedUntil: null };
	}
	bucket!.failures += 1;
	if (bucket!.failures >= maxAttempts) {
		bucket!.lockedUntil = now + lockoutMs;
	}
	buckets.set(key, bucket!);
}

export function recordLoginFailure(clientKey: string): void {
	const cfg = getConfig();
	const now = Date.now();
	bumpBucket(clientKey, now, cfg.maxAttempts, cfg.windowMs, cfg.lockoutMs);
	bumpBucket(GLOBAL_KEY, now, cfg.globalMaxAttempts, cfg.globalWindowMs, cfg.globalWindowMs);
}

export function recordLoginSuccess(clientKey: string): void {
	buckets.delete(clientKey);
	buckets.delete(GLOBAL_KEY);
}

export function getClientKey(req: NextRequest): string {
	const hops = getConfig().trustedProxyHops;
	if (hops <= 0) return 'ip:direct';

	const forwarded = req.headers.get('x-forwarded-for');
	if (forwarded) {
		const chain = forwarded
			.split(',')
			.map(entry => entry.trim())
			.filter(Boolean);
		const index = chain.length - hops;
		const candidate = chain[index >= 0 ? index : 0];
		if (candidate) return `ip:${candidate}`;
	}

	const realIp = req.headers.get('x-real-ip');
	if (realIp?.trim()) return `ip:${realIp.trim()}`;
	return 'ip:unknown';
}

export function retryAfterHeaders(decision: RateLimitDecision): Record<string, string> {
	return decision.retryAfterSeconds > 0
		? { 'Retry-After': String(decision.retryAfterSeconds) }
		: {};
}
