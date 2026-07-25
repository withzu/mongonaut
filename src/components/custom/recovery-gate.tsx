'use client';

import { useEffect, useState } from 'react';
import { ChangePasswordDialog } from '@/components/custom/change-password-dialog';
import { fetchAuthMe } from '@/lib/auth/me-client';

export function RecoveryGate() {
	const [mustChange, setMustChange] = useState(false);

	useEffect(() => {
		let cancelled = false;
		void fetchAuthMe().then(data => {
			if (!cancelled && data?.mustChangePassword) setMustChange(true);
		});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!mustChange) return null;

	return <ChangePasswordDialog open recovery onOpenChange={() => {}} />;
}
