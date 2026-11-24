import type { Metadata } from 'next';

import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import React from 'react';
import Providers from '@/app/providers';
import { ReactScan } from '@/components/custom/react-scan';
import { envBool } from '@/lib/env';

const uiFont = Inter({
	variable: '--mgn-font-ui',
	subsets: ['latin'],
});

const codeFont = JetBrains_Mono({
	variable: '--mgn-font-code',
	subsets: ['latin'],
});

export const metadata: Metadata = {
	title: 'Mongonaut',
	description: 'Mongonaut is a lightweight easy-to-use MongoDB UI for the web.',
	robots: {
		index: false,
		follow: false,
		nocache: true,
		googleBot: {
			'index': false,
			'follow': false,
			'noimageindex': true,
			'max-snippet': 0,
			'max-image-preview': 'none',
			'max-video-preview': 0,
		},
	},
	referrer: 'no-referrer',
};

interface RootLayoutProps {
	children: React.ReactNode;
}

export default async function RootLayout({ children }: Readonly<RootLayoutProps>) {
	return (
		<html lang="en" className="w-full h-full" suppressHydrationWarning>
			{envBool('DEV_REACTSCAN', false) && <ReactScan />}
			<body className={`${uiFont.variable} ${codeFont.variable} antialiased w-full h-full`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
