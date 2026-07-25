import 'server-only';

import { envBool } from '@/lib/env';

export type AuditOutcome = 'success' | 'denied' | 'error';

export interface AuditEvent {
	action: string;
	actor: string;
	outcome: AuditOutcome;
	database?: string;
	collection?: string;
	target?: string;
	count?: number;
	detail?: string;
}

export function audit(event: AuditEvent): void {
	if (!envBool('MONGONAUT_AUDIT_LOG', true)) return;

	const payload: Record<string, unknown> = { ts: new Date().toISOString() };
	for (const [key, value] of Object.entries(event)) {
		if (value !== undefined && value !== '') payload[key] = value;
	}

	console.log(`[mongonaut:audit] ${JSON.stringify(payload)}`);
}
