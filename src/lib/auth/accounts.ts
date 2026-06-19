import 'server-only';

import { hash, verify } from '@node-rs/argon2';
import { ObjectId, type Collection as MongoCollection } from 'mongodb';
import { getMongoController } from '@/lib/mongoController';
import { env } from '@/lib/env';

export type GrantAccess = 'read' | 'readWrite';

export interface Grant {
	database: string;
	collection: string | '*';
	access: GrantAccess;
}

export interface AccountDoc {
	_id: ObjectId;
	email: string;
	passwordHash: string;
	isAdmin: boolean;
	disabled: boolean;
	grants: Grant[];
	tokenVersion: number;
	name?: string;
	createdAt: Date;
	updatedAt: Date;
	recoveryHash?: string;
	recoveryExpiresAt?: Date;
}

export interface PublicAccount {
	id: string;
	email: string;
	name?: string;
	isAdmin: boolean;
	disabled: boolean;
	grants: Grant[];
	createdAt: string;
	updatedAt: string;
}

export const INTERNAL_DB = env('MONGONAUT_SYSTEM_DB', '__mongonaut').trim() || '__mongonaut';
const ACCOUNTS_COLLECTION = 'accounts';

let indexesEnsured = false;
let dummyHashPromise: Promise<string> | null = null;

async function accountsCollection(): Promise<MongoCollection<AccountDoc>> {
	const controller = getMongoController();
	const connection = await controller.ensureConnection();
	if (!connection.success) {
		throw connection.error ?? new Error('Could not connect to MongoDB');
	}
	const collection = controller.client.db(INTERNAL_DB).collection<AccountDoc>(ACCOUNTS_COLLECTION);
	if (!indexesEnsured) {
		await collection.createIndex({ email: 1 }, { unique: true });
		indexesEnsured = true;
	}
	return collection;
}

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function hashPassword(password: string): Promise<string> {
	return hash(password);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
	try {
		return await verify(passwordHash, password);
	} catch {
		return false;
	}
}

export async function verifyRecovery(account: AccountDoc, password: string): Promise<boolean> {
	if (!account.recoveryHash || !account.recoveryExpiresAt) return false;
	if (account.recoveryExpiresAt.getTime() < Date.now()) return false;
	if (!password) return false;
	return verifyPassword(account.recoveryHash, password);
}

export async function dummyVerify(password: string): Promise<void> {
	try {
		if (!dummyHashPromise) {
			dummyHashPromise = hashPassword('mongonaut-timing-equalizer');
		}
		await verify(await dummyHashPromise, password);
	} catch {
		// ignored — only here to spend comparable time
	}
}

export function toPublicAccount(account: AccountDoc): PublicAccount {
	return {
		id: account._id.toString(),
		email: account.email,
		name: account.name,
		isAdmin: account.isAdmin,
		disabled: account.disabled,
		grants: account.grants,
		createdAt: account.createdAt.toISOString(),
		updatedAt: account.updatedAt.toISOString(),
	};
}

export async function countAccounts(): Promise<number> {
	const collection = await accountsCollection();
	return collection.countDocuments();
}

export async function countActiveAdmins(): Promise<number> {
	const collection = await accountsCollection();
	return collection.countDocuments({ isAdmin: true, disabled: { $ne: true } });
}

export async function findAccountByEmail(email: string): Promise<AccountDoc | null> {
	const collection = await accountsCollection();
	return collection.findOne({ email: normalizeEmail(email) });
}

export async function findAccountById(id: string): Promise<AccountDoc | null> {
	if (!ObjectId.isValid(id)) return null;
	const collection = await accountsCollection();
	return collection.findOne({ _id: new ObjectId(id) });
}

export async function listAccounts(): Promise<AccountDoc[]> {
	const collection = await accountsCollection();
	return collection.find({}).sort({ createdAt: 1 }).toArray();
}

export interface CreateAccountInput {
	email: string;
	password: string;
	name?: string;
	isAdmin?: boolean;
	grants?: Grant[];
}

export async function createAccount(input: CreateAccountInput): Promise<AccountDoc> {
	const collection = await accountsCollection();
	const now = new Date();
	const doc: Omit<AccountDoc, '_id'> = {
		email: normalizeEmail(input.email),
		passwordHash: await hashPassword(input.password),
		isAdmin: input.isAdmin ?? false,
		disabled: false,
		grants: input.grants ?? [],
		tokenVersion: 0,
		...(input.name ? { name: input.name } : {}),
		createdAt: now,
		updatedAt: now,
	};
	const result = await collection.insertOne(doc as AccountDoc);
	return { ...(doc as AccountDoc), _id: result.insertedId };
}

export class LastAdminError extends Error {
	constructor() {
		super('At least one active administrator must remain');
		this.name = 'LastAdminError';
	}
}

export interface UpdateAccountInput {
	name?: string;
	isAdmin?: boolean;
	disabled?: boolean;
	grants?: Grant[];
}

export async function updateAccount(id: string, patch: UpdateAccountInput): Promise<void> {
	if (!ObjectId.isValid(id)) throw new Error('Invalid account id');
	const collection = await accountsCollection();
	const account = await collection.findOne({ _id: new ObjectId(id) });
	if (!account) throw new Error('Account not found');

	const willLoseAdmin =
		(patch.isAdmin === false && account.isAdmin) || (patch.disabled === true && !account.disabled);
	if (willLoseAdmin && account.isAdmin && !account.disabled) {
		const remaining = await countActiveAdmins();
		if (remaining <= 1) throw new LastAdminError();
	}

	const update: Partial<AccountDoc> = { updatedAt: new Date() };
	if (patch.name !== undefined) update.name = patch.name;
	if (patch.isAdmin !== undefined) update.isAdmin = patch.isAdmin;
	if (patch.disabled !== undefined) update.disabled = patch.disabled;
	if (patch.grants !== undefined) update.grants = patch.grants;

	await collection.updateOne({ _id: new ObjectId(id) }, { $set: update });
}

export async function setAccountPassword(id: string, password: string): Promise<void> {
	if (!ObjectId.isValid(id)) throw new Error('Invalid account id');
	const collection = await accountsCollection();
	await collection.updateOne(
		{ _id: new ObjectId(id) },
		{
			$set: { passwordHash: await hashPassword(password), updatedAt: new Date() },
			$inc: { tokenVersion: 1 },
			$unset: { recoveryHash: '', recoveryExpiresAt: '' },
		},
	);
}

export async function deleteAccount(id: string): Promise<void> {
	if (!ObjectId.isValid(id)) throw new Error('Invalid account id');
	const collection = await accountsCollection();
	const account = await collection.findOne({ _id: new ObjectId(id) });
	if (!account) return;
	if (account.isAdmin && !account.disabled) {
		const remaining = await countActiveAdmins();
		if (remaining <= 1) throw new LastAdminError();
	}
	await collection.deleteOne({ _id: new ObjectId(id) });
}
