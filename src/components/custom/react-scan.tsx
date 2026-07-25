'use client';

import { useEffect } from 'react';

export function ReactScan() {
	useEffect(() => {
		if (process.env.NODE_ENV === 'production') return;

		void import('react-scan').then(({ scan }) => scan({ enabled: true }));
	}, []);

	return null;
}
