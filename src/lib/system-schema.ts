import 'server-only';

import type { Db, ObjectId } from 'mongodb';
import { getMongoController } from '@/lib/mongoController';
import { env } from '@/lib/env';
import { getAppVersion } from '@/lib/version';

/**
 * Versioning of the internal system database (`MONGONAUT_SYSTEM_DB`).
 *
 * The current version is stored in `meta` under `_id: 'schema'`. On first use of
 * the system database every migration above the stored version runs in order,
 * and the version is raised after each one.
 *
 * Rules for adding a migration:
 * - Append it to MIGRATIONS with the next version number. Never change or
 *   remove a migration that has shipped in a release.
 * - Migrations must be idempotent. Several instances can start at the same time
 *   against the same database, and a migration can be interrupted before its
 *   version is recorded, so the same migration may run more than once.
 * - Keep `scripts/recovery.mjs` (SUPPORTED_SCHEMA_VERSION) in sync.
 */

export interface SystemMigration {
	version: number;
	description: string;
	up: (db: Db) => Promise<void>;
}

interface SchemaDoc {
	_id: 'schema';
	version: number;
	updatedAt: Date;
	appVersion: string;
}

export const INTERNAL_DB = env('MONGONAUT_SYSTEM_DB', '__mongonaut').trim() || '__mongonaut';
const META_COLLECTION = 'meta';
const SCHEMA_ID = 'schema';

export const MIGRATIONS: SystemMigration[] = [
	{
		version: 1,
		description: 'Baseline: unique email index and account field defaults',
		up: async db => {
			const accounts = db.collection('accounts');
			await accounts.createIndex({ email: 1 }, { unique: true });
			await accounts.updateMany(
				{ tokenVersion: { $exists: false } },
				{ $set: { tokenVersion: 0 } },
			);
			await accounts.updateMany({ grants: { $exists: false } }, { $set: { grants: [] } });
			await accounts.updateMany({ disabled: { $exists: false } }, { $set: { disabled: false } });
			await accounts.updateMany({ isAdmin: { $exists: false } }, { $set: { isAdmin: false } });
		},
	},
];

export const SYSTEM_SCHEMA_VERSION = MIGRATIONS.at(-1)?.version ?? 0;

export class SystemSchemaTooNewError extends Error {
	constructor(stored: number) {
		super(
			`The system database has schema version ${stored}, but this Mongonaut release only supports up to ${SYSTEM_SCHEMA_VERSION}. ` +
				'It was written by a newer Mongonaut release. Downgrading is not supported, please run that release or a newer one.',
		);
		this.name = 'SystemSchemaTooNewError';
	}
}

async function readVersion(db: Db): Promise<number> {
	const doc = await db
		.collection<SchemaDoc>(META_COLLECTION)
		.findOne({ _id: SCHEMA_ID as unknown as ObjectId & 'schema' });
	return typeof doc?.version === 'number' ? doc.version : 0;
}

async function runMigrations(db: Db): Promise<void> {
	const stored = await readVersion(db);
	if (stored > SYSTEM_SCHEMA_VERSION) throw new SystemSchemaTooNewError(stored);

	for (const migration of MIGRATIONS) {
		if (migration.version <= stored) continue;
		console.log(
			`[mongonaut] migrating system database to schema version ${migration.version}: ${migration.description}`,
		);
		await migration.up(db);
		await db
			.collection<SchemaDoc>(META_COLLECTION)
			.updateOne(
				{
					_id: SCHEMA_ID as unknown as ObjectId & 'schema',
					$or: [{ version: { $lt: migration.version } }, { version: { $exists: false } }],
				},
				{
					$set: { version: migration.version, updatedAt: new Date(), appVersion: getAppVersion() },
				},
				{ upsert: true },
			)
			.catch(error => {
				if ((error as { code?: number }).code !== 11000) throw error;
			});
	}
}

let schemaPromise: Promise<void> | null = null;

/**
 * Brings the system database to SYSTEM_SCHEMA_VERSION. Runs once per process,
 * a failed attempt is retried on the next call.
 */
export function ensureSystemSchema(): Promise<void> {
	if (!schemaPromise) {
		schemaPromise = (async () => {
			const controller = getMongoController();
			const connection = await controller.ensureConnection();
			if (!connection.success) {
				throw connection.error ?? new Error('Could not connect to MongoDB');
			}
			await runMigrations(controller.client.db(INTERNAL_DB));
		})().catch(error => {
			schemaPromise = null;
			throw error;
		});
	}
	return schemaPromise;
}
