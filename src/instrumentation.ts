export async function register() {
	if (process.env.NEXT_RUNTIME !== 'nodejs') return;

	const SENSITIVE = /(SECRET|PASSWORD|CONNECTION_URL|TOKEN|EMAIL)/i;

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

	if (process.env.NEXT_PHASE === 'phase-production-build') return;

	// Connect once at startup so an unreachable MongoDB shows up in the logs right
	// away instead of on the first request. The controller logs the outcome.
	const { getMongoController } = await import('@/lib/mongoController');
	try {
		const connecting = getMongoController().ensureConnection();
		if (cfg.mode === 'ACCOUNT') {
			// Migrate the system database at startup, so a schema problem shows up in
			// the logs right away. Requests retry it if this attempt fails.
			const { ensureSystemSchema } = await import('@/lib/system-schema');
			void connecting.then(result => {
				if (!result.success) return;
				ensureSystemSchema().catch(error =>
					console.error(
						`[mongonaut] system database migration failed: ${error instanceof Error ? error.message : String(error)}`,
					),
				);
			});
		}
	} catch (error) {
		console.error(
			`[mongonaut] MONGO_CONNECTION_URL is not a valid MongoDB connection string: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
