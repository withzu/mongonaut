import type { Metadata } from 'next';
 
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import Providers from '@/app/providers';
import { DatabaseFetcher } from '@/components/custom/database-fetcher';
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
};

interface RootLayoutProps {
	children: React.ReactNode;
}

export default async function RootLayout({ children }: Readonly<RootLayoutProps>) {
	return (
		<html lang="en" className="w-full h-full" suppressHydrationWarning>
			{envBool('DEV_REACTSCAN', false) && <ReactScan />}
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-full`}>
				<Providers>
					<SidebarProvider
						style={
							{
								'--sidebar-width': '350px',
							} as React.CSSProperties
						}
					>
						<DatabaseFetcher>{children}</DatabaseFetcher>
					</SidebarProvider>
				</Providers>
			</body>
		</html>
	);
}
