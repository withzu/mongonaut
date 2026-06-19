#!/usr/bin/env node
/**
 * Admin password recovery for ACCOUNT mode.
 *
 * Generates a one-time temporary password and stores ONLY its hash in a separate
 * field (recoveryHash) on the target account(s). The real password is never
 * touched. The plaintext temporary password is printed here, on the server
 * console, and is valid for a limited time. Signing in with it forces an
 * immediate password change in the app.
 *
 * Usage:
 *   pnpm recovery                 # all admin accounts
 *   pnpm recovery user@email.com  # a specific account
 */

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
		} catch {
			// file not present — ignore
		}
	}
	return undefined;
}

function generatePassword() {
	// ~32 chars, URL-safe, ample entropy.
	return randomBytes(24).toString('base64url');
}

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
