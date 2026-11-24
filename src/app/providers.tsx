'use client';

import { ThemeProvider } from 'next-themes';
import type { FC, ReactElement, ReactNode } from 'react';
import { GlobalErrorBoundary } from '@/components/error/error-boundary';
import { Toaster } from '@/components/ui/sonner';

type ProvidersProps = {
	children: ReactNode;
};

const Providers: FC<ProvidersProps> = ({ children }): ReactElement => (
	<GlobalErrorBoundary>
		<ThemeProvider attribute="class">
			{children}
			<Toaster />
		</ThemeProvider>
	</GlobalErrorBoundary>
);

export default Providers;
