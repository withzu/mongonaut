'use client';

import { useEffect, useState } from 'react';
import { ChangePasswordDialog } from '@/components/custom/change-password-dialog';

export function RecoveryGate() {
	const [mustChange, setMustChange] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/auth/me', { cache: 'no-store' })
			.then(r => (r.ok ? r.json() : null))
			.then((data: { mustChangePassword?: boolean } | null) => {
				if (!cancelled && data?.mustChangePassword) setMustChange(true);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	if (!mustChange) return null;

	return <ChangePasswordDialog open recovery onOpenChange={() => {}} />;
}
