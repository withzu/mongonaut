import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Liveness only: the process is running and able to answer. It deliberately
 * does not touch MongoDB, so a restart loop is never triggered by a database
 * that is merely slow. Use `/api/ready` to find out whether Mongonaut can
 * actually serve.
 */
export async function GET() {
	return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
