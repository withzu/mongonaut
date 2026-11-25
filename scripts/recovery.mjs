#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { hash } from '@node-rs/argon2';

const TTL_MINUTES = Number(process.env.MONGONAUT_RECOVERY_TTL_MINUTES || 30);
const ENV_FILES = ['.env', '.env.local', '.env.development'];

function readEnv(key) {
	if (process.env[key]) return process.env[key];
	for (const file of ENV_FILES) {
		try {
			const content = readFileSync(file, 'utf8');
			const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
			if (match) {
				return match[1].trim().replace(/^['"]|['"]$/g, '');
			}
		} catch {}
	}
	return undefined;
}

function generatePassword() {
	return randomBytes(24).toString('base64url');
}

// Highest system database schema version this script understands. Keep in sync
// with SYSTEM_SCHEMA_VERSION in src/lib/system-schema.ts.
const SUPPORTED_SCHEMA_VERSION = 1;

async function main() {
	const url = readEnv('MONGO_CONNECTION_URL');
	if (!url) {
		console.error('[recovery] MONGO_CONNECTION_URL is not set.');
		process.exit(1);
	}
	const systemDb = readEnv('MONGONAUT_SYSTEM_DB') || '__mongonaut';
	const targetEmail = process.argv[2]?.trim().toLowerCase();

	const client = new MongoClient(url);
	await client.connect();
	try {
		const schema = await client.db(systemDb).collection('meta').findOne({ _id: 'schema' });
		if (typeof schema?.version === 'number' && schema.version > SUPPORTED_SCHEMA_VERSION) {
			console.error(
				`[recovery] The system database has schema version ${schema.version}, this release supports up to ${SUPPORTED_SCHEMA_VERSION}. Run the recovery command of the newer release.`,
			);
			process.exit(1);
		}
		const accounts = client.db(systemDb).collection('accounts');
		const filter = targetEmail ? { email: targetEmail } : { isAdmin: true };
		const targets = await accounts.find(filter).toArray();

		if (targets.length === 0) {
			console.error(
				targetEmail
					? `[recovery] No account found for "${targetEmail}".`
					: '[recovery] No admin accounts found.',
			);
			process.exit(1);
		}

		const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

		console.log('');
		console.log('=== Mongonaut password recovery ===');
		for (const account of targets) {
			const tempPassword = generatePassword();
			const recoveryHash = await hash(tempPassword);
			await accounts.updateOne(
				{ _id: account._id },
				{ $set: { recoveryHash, recoveryExpiresAt: expiresAt } },
			);
			console.log('');
			console.log(`  account:            ${account.email}`);
			console.log(`  temporary password: ${tempPassword}`);
		}
		console.log('');
		console.log(`Valid for ${TTL_MINUTES} minutes. Sign in with it, then set a new password.`);
		console.log('The existing password is unchanged until a new one is set.');
		console.log('===================================');
		console.log('');
	} finally {
		await client.close();
	}
}

main().catch(error => {
	console.error('[recovery] failed:', error);
	process.exit(1);
});
