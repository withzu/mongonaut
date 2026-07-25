'use client';

import { useTheme } from 'next-themes';
import { useIsHydrated } from '@/hooks/use-is-hydrated';

export function usePreferredTheme(): 'light' | 'dark' {
	const { resolvedTheme } = useTheme();
	const hydrated = useIsHydrated();

	if (!hydrated) return 'light';
	return resolvedTheme === 'dark' ? 'dark' : 'light';
}
