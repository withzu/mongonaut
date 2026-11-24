'use client';

import { useEffect, useEffectEvent, useSyncExternalStore } from 'react';
import {
	isMac,
	registerShortcut,
	singleKeysEnabled,
	subscribeSingleKeys,
	type ShortcutHandler,
	type ShortcutId,
} from '@/lib/shortcuts';

export function useShortcut(id: ShortcutId, handler: ShortcutHandler, enabled = true): void {
	const onShortcut = useEffectEvent(handler);

	useEffect(() => {
		if (!enabled) return;
		return registerShortcut(id, () => onShortcut());
	}, [id, enabled]);
}

const noSubscription = () => () => {};

/** Null until the browser is known, so server and client render the same. */
export function useIsMac(): boolean | null {
	return useSyncExternalStore<boolean | null>(noSubscription, isMac, () => null);
}

export function useSingleKeys(): boolean {
	return useSyncExternalStore(subscribeSingleKeys, singleKeysEnabled, () => true);
}
