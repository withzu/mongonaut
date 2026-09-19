import { NextResponse } from 'next/server';
import { getMongoController } from '@/lib/mongoController';
import { getPublicAuthInfo } from '@/lib/auth/config';
import { getAppVersion } from '@/lib/version';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Readiness: can Mongonaut actually serve requests right now? Unlike
 * `/api/health`, which only proves the process is up, this reaches MongoDB and
 * reports a misconfigured auth setup. The container health check uses this one.
 */
export async function GET() {
	const auth = getPublicAuthInfo();
	const connection = await getMongoController().ensureConnection();
	const ready = connection.success && !auth.misconfigured;

	return NextResponse.json(
		{
			status: ready ? 'ready' : 'unavailable',
			version: getAppVersion(),
			mongo: connection.success ? 'connected' : 'unreachable',
			...(connection.success ? {} : { mongoError: connection.error }),
			auth: { mode: auth.mode, enabled: auth.enabled, misconfigured: auth.misconfigured },
		},
		{ status: ready ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
	);
}
