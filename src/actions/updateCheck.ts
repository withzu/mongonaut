'use server';

import { canAdministerInstance, getAccessContext } from '@/lib/auth/server';
import {
	findAvailableUpdate,
	isUpdateCheckEnabled,
	type AvailableUpdate,
} from '@/lib/update-check';

export const getAvailableUpdate = async (): Promise<AvailableUpdate | null> => {
	if (!isUpdateCheckEnabled()) return null;
	if (!canAdministerInstance(await getAccessContext())) return null;
	return findAvailableUpdate();
};
