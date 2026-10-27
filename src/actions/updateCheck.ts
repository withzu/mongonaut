'use server';

import { canAdministerInstance, getAccessContext } from '@/lib/auth/server';
import {
	findAvailableUpdate,
	isUpdateCheckEnabled,
	type AvailableUpdate,
} from '@/lib/update-check';

/**
 * Only people who can run the instance are told about a new release. Everyone
 * else could not act on it, so the hint would just be noise for them.
 */
export const getAvailableUpdate = async (): Promise<AvailableUpdate | null> => {
	if (!isUpdateCheckEnabled()) return null;
	if (!canAdministerInstance(await getAccessContext())) return null;
	return findAvailableUpdate();
};
