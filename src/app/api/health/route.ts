import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Liveness only. Deliberately skips MongoDB so a slow database never causes restarts.
export async function GET() {
	return NextResponse.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } });
}
