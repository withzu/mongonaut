'use server';

import { describeActor, requireAdmin } from '@/lib/auth/server';
import {
	createAccount,
	deleteAccount,
	DuplicateEmailError,
	LastAdminError,
	listAccounts,
	setAccountPassword,
	toPublicAccount,
	updateAccount,
	type Grant,
	type PublicAccount,
} from '@/lib/auth/accounts';
import { audit } from '@/lib/mongo/audit';
import { validatePassword } from '@/lib/auth/policy';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AdminResult<T = undefined> = { success: true; data?: T } | { success: false; error: string };

function errorMessage(error: unknown): string {
	if (error instanceof LastAdminError) return error.message;
	if (error instanceof DuplicateEmailError) return error.message;
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
	if (!guard.allowed) return { success: false, error: guard.error };
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
	if (!guard.allowed) return { success: false, error: guard.error };

	const email = input.email?.trim() ?? '';
	if (!EMAIL_PATTERN.test(email)) {
		return { success: false, error: 'Please provide a valid email address' };
	}
	const passwordError = validatePassword(input.password);
	if (passwordError) return { success: false, error: passwordError };

	try {
		const account = await createAccount({
			email,
			password: input.password,
			name: input.name?.trim() || undefined,
			isAdmin: !!input.isAdmin,
			grants: validateGrants(input.grants),
		});
		audit({
			action: 'account.create',
			actor: describeActor(guard.ctx),
			outcome: 'success',
			target: account.email,
		});
		return { success: true, data: toPublicAccount(account) };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}

export interface UpdateAccountActionInput {
	email?: string;
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
	if (!guard.allowed) return { success: false, error: guard.error };

	if (patch.email !== undefined && !EMAIL_PATTERN.test(patch.email.trim())) {
		return { success: false, error: 'Please provide a valid email address' };
	}

	try {
		await updateAccount(id, {
			email: patch.email?.trim(),
			name: patch.name,
			isAdmin: patch.isAdmin,
			disabled: patch.disabled,
			grants: patch.grants !== undefined ? validateGrants(patch.grants) : undefined,
		});
		audit({
			action: 'account.update',
			actor: describeActor(guard.ctx),
			outcome: 'success',
			target: patch.email?.trim() || id,
		});
		return { success: true };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}

export async function setAccountPasswordAction(id: string, password: string): Promise<AdminResult> {
	const guard = await requireAdmin();
	if (!guard.allowed) return { success: false, error: guard.error };
	const passwordError = validatePassword(password);
	if (passwordError) return { success: false, error: passwordError };
	try {
		await setAccountPassword(id, password);
		audit({
			action: 'account.resetPassword',
			actor: describeActor(guard.ctx),
			outcome: 'success',
			target: id,
		});
		return { success: true };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}

export async function deleteAccountAction(id: string): Promise<AdminResult> {
	const guard = await requireAdmin();
	if (!guard.allowed) return { success: false, error: guard.error };
	// An administrator must not remove their own access by accident.
	if (guard.ctx.account?._id.toString() === id) {
		return { success: false, error: 'You cannot delete your own account' };
	}
	try {
		await deleteAccount(id);
		audit({
			action: 'account.delete',
			actor: describeActor(guard.ctx),
			outcome: 'success',
			target: id,
		});
		return { success: true };
	} catch (error) {
		return { success: false, error: errorMessage(error) };
	}
}
