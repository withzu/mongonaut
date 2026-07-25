export const MIN_PASSWORD_LENGTH = 8;

export const MIN_AUTH_SECRET_LENGTH = 32;

export function validatePassword(password: unknown): string | null {
	if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
		return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
	}
	if (password.length > 1024) {
		return 'Password must be at most 1024 characters';
	}
	return null;
}
