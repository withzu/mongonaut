export function env(key: string, defaultValue: string): string {
	return process.env[key] ?? defaultValue;
}

export function envBool(key: string, defaultValue: boolean): boolean {
	const raw = process.env[key]?.trim().toLowerCase();
	if (!raw) return defaultValue;
	if (raw === 'true' || raw === '1' || raw === 'yes' || raw === 'on') return true;
	if (raw === 'false' || raw === '0' || raw === 'no' || raw === 'off') return false;
	return defaultValue;
}

export interface IntBounds {
	min?: number;
	max?: number;
}

export function clampInt(value: unknown, defaultValue: number, bounds: IntBounds = {}): number {
	const parsed = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
	let result = Number.isFinite(parsed) ? Math.trunc(parsed) : defaultValue;
	if (bounds.min !== undefined && result < bounds.min) result = bounds.min;
	if (bounds.max !== undefined && result > bounds.max) result = bounds.max;
	return result;
}

export function envInt(key: string, defaultValue: number, bounds: IntBounds = {}): number {
	const raw = process.env[key];
	if (raw === undefined || raw.trim() === '') return clampInt(defaultValue, defaultValue, bounds);
	return clampInt(raw, defaultValue, bounds);
}
