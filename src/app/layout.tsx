import type { Metadata } from 'next';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import React from 'react';
import Providers from '@/app/providers';
import { ReactScan } from '@/components/custom/react-scan';
import { envBool } from '@/lib/env';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
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
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full`}>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
