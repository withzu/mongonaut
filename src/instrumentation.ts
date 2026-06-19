export async function register() {
	if (process.env.NEXT_RUNTIME !== 'nodejs') return;

	const SENSITIVE = /(SECRET|PASSWORD|CONNECTION_URL|TOKEN)/i;

	const keys = Object.keys(process.env)
		.filter(k => k.startsWith('MONGONAUT_') || k === 'MONGO_CONNECTION_URL')
		.sort();

	const envLines = keys.length
		? keys.map(k => {
				const value = (process.env[k] ?? '').trim();
				if (!value) return `  ${k} = <empty>`;
				if (SENSITIVE.test(k)) return `  ${k} = set (len=${value.length})`;
				return `  ${k} = ${value}`;
			})
		: ['  (no MONGONAUT_* or MONGO_CONNECTION_URL env vars found)'];

	const { getAuthConfig, getPublicAuthInfo } = await import('@/lib/auth/config');
	const cfg = getAuthConfig();
	const info = getPublicAuthInfo();

	console.log(
		[
			'[mongonaut] startup env check',
			...envLines,
			`  resolved auth: mode=${cfg.mode} secretConfigured=${!!cfg.secret} enabled=${info.enabled} misconfigured=${info.misconfigured}`,
		].join('\n'),
	);
}
