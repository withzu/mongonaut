import { envBool } from '@/lib/env';
import { getAppVersion } from '@/lib/version';

const LATEST_RELEASE_URL = 'https://api.github.com/repos/withzu/mongonaut/releases/latest';
const RELEASE_PAGE_PREFIX = 'https://github.com/withzu/mongonaut/releases/';
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RETRY_INTERVAL_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 5000;
const VERSION_PATTERN = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export interface AvailableUpdate {
	version: string;
	url: string;
}

interface LatestRelease {
	version: string;
	url: string;
}

let cached: { latest: LatestRelease | null; expiresAt: number } | null = null;
let pending: Promise<LatestRelease | null> | null = null;

export function isUpdateCheckEnabled(): boolean {
	return envBool('MONGONAUT_UPDATE_CHECK', true);
}

function parseVersion(version: string) {
	const match = VERSION_PATTERN.exec(version.trim());
	if (!match) return null;
	return {
		core: [Number(match[1]), Number(match[2]), Number(match[3])],
		prerelease: match[4] !== undefined,
	};
}

/**
 * Only compares against stable releases, so a prerelease of the same version
 * counts as older and every other prerelease detail can be ignored.
 */
export function isNewerVersion(candidate: string, current: string): boolean {
	const next = parseVersion(candidate);
	const installed = parseVersion(current);
	if (!next || !installed) return false;

	for (let i = 0; i < 3; i++) {
		if (next.core[i] !== installed.core[i]) return next.core[i] > installed.core[i];
	}
	return installed.prerelease && !next.prerelease;
}

async function fetchLatestRelease(): Promise<LatestRelease | null> {
	const response = await fetch(LATEST_RELEASE_URL, {
		headers: {
			'Accept': 'application/vnd.github+json',
			'User-Agent': `mongonaut/${getAppVersion()}`,
		},
		cache: 'no-store',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (!response.ok) return null;

	const body = (await response.json()) as { tag_name?: unknown; html_url?: unknown };
	const tag = typeof body.tag_name === 'string' ? body.tag_name : '';
	const url = typeof body.html_url === 'string' ? body.html_url : '';
	if (!parseVersion(tag) || !url.startsWith(RELEASE_PAGE_PREFIX)) return null;
	return { version: tag.replace(/^v/, ''), url };
}

/**
 * The newest stable release, looked up on GitHub at most every few hours.
 * Instances without internet access simply never show a hint, so a failed
 * lookup is not reported and only retried later.
 */
async function getLatestRelease(): Promise<LatestRelease | null> {
	if (cached && cached.expiresAt > Date.now()) return cached.latest;

	pending ??= fetchLatestRelease()
		.catch(() => null)
		.then(latest => {
			const interval = latest ? CHECK_INTERVAL_MS : RETRY_INTERVAL_MS;
			cached = { latest, expiresAt: Date.now() + interval };
			return latest;
		})
		.finally(() => {
			pending = null;
		});
	return pending;
}

export async function findAvailableUpdate(): Promise<AvailableUpdate | null> {
	if (!isUpdateCheckEnabled()) return null;
	const latest = await getLatestRelease();
	if (!latest || !isNewerVersion(latest.version, getAppVersion())) return null;
	return latest;
}
