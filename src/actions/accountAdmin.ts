'use server';

import { requireAdmin } from '@/lib/auth/server';
import {
	createAccount,
	deleteAccount,
	LastAdminError,
	listAccounts,
	setAccountPassword,
	toPublicAccount,
	updateAccount,
	type Grant,
	type PublicAccount,
} from '@/lib/auth/accounts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type AdminResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

function errorMessage(error: unknown): string {
	if (error instanceof LastAdminError) return error.message;
	if (error instanceof Error) return error.message;
	return 'An unknown error occurred';
}

function validateGrants(grants: unknown): Grant[] {
	if (!Array.isArray(grants)) return [];
	const result: Grant[] = [];
	for (const raw of grants) {
		if (!raw || typeof raw !== 'object') continue;
		const g = raw as Record<string, unknown>;
		const database = typeof g.database === 'string' ? g.database.trim() : '';
		const collection = typeof g.collection === 'string' ? g.collection.trim() : '';
		const access = g.access === 'readWrite' ? 'readWrite' : 'read';
		if (!database) continue;
		result.push({ database, collection: collection || '*', access });
	}
	return result;
}

export async function listAccountsAction(): Promise<AdminResult<PublicAccount[]>> {
	const guard = await requireAdmin();
	if (guard) return { success: false, error: guard.error.message };
	const accounts = await listAccounts();
	return { success: true, data: accounts.map(toPublicAccount) };
}

export interface CreateAccountActionInput {
	email: string;
	password: string;
	name?: string;
	isAdmin?: boolean;
	grants?: unknown;
}

export async function createAccountAction(
	input: CreateAccountActionInput,
): Promise<AdminResult<PublicAccount>> {
	const guard = await requireAdmin();
	if (guard) return { success: false, error: guard.error.message };

	const email = input.email?.trim() ?? '';
	if (!EMAIL_PATTERN.test(email)) {
		return { success: false, error: 'Please provide a valid email address' };
	}
	if (!input.password || input.password.length < MIN_PASSWORD_LENGTH) {
		return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
	}

	try {
		const account = await createAccount({
			email,
			password: input.password,
			name: input.name?.trim() || undefined,
			isAdmin: !!input.isAdmin,
			grants: validateGrants(input.grants),
		});
		return { success: true, data: toPublicAccount(account) };
	} catch (error) {
		// Duplicate email surfaces as a unique-index violation.
		return { success: false, error: errorMessage(error) };
	}
}

export interface UpdateAccountActionInput {
	name?: string;
	isAdmin?: boolean;
	disabled?: boolean;
	grants?: unknown;
}

export async function updateAccountAction(
	id: string,
	patch: UpdateAccountActionInput,
): Promise<AdminResult> {
	const guard = await requireAdmin();
	if (guard) return { success: false, error: guard.error.message };

	try {
		await updateAccount(id, {
			name: patch.name,
			isAdmin: patch.isAdmin,
			disabled: patch.disabled,
			grants: patch.grants !== undefined ? validateGrants(patch.grants) : undefined,
		});
		return { success: true };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}

export async function setAccountPasswordAction(id: string, password: string): Promise<AdminResult> {
	const guard = await requireAdmin();
	if (guard) return { success: false, error: guard.error.message };
	if (!password || password.length < MIN_PASSWORD_LENGTH) {
		return { success: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
	}
	try {
		await setAccountPassword(id, password);
		return { success: true };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}

export async function deleteAccountAction(id: string): Promise<AdminResult> {
	const guard = await requireAdmin();
	if (guard) return { success: false, error: guard.error.message };
	try {
		await deleteAccount(id);
		return { success: true };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}
