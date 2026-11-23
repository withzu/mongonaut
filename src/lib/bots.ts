import { isbot } from 'isbot';
import { envBool } from '@/lib/env';

export const ROBOTS_DIRECTIVES = 'noindex, nofollow, noarchive, nosnippet, noimageindex';

const BOT_EXEMPT_PATHS = ['/api/health', '/api/ready', '/robots.txt'];

export function isBotBlockingEnabled(): boolean {
	return envBool('MONGONAUT_BLOCK_BOTS', true);
}

export function shouldBlockAsBot(pathname: string, userAgent: string | null): boolean {
	if (BOT_EXEMPT_PATHS.includes(pathname)) return false;
	const ua = userAgent?.trim() ?? '';
	if (!ua) return true;
	return isbot(ua);
}
