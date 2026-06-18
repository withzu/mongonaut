'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { InfoIcon, LogOutIcon, MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import type { AuthMode } from '@/lib/auth/config';
import { Button } from '@/components/ui/button';
import { cn, usePreferredTheme } from '@/lib/utils';

interface AuthMeResponse {
	mode: AuthMode;
	enabled: boolean;
	authenticated: boolean;
	user: { subject: string; mode: AuthMode; email: string | null; name: string | null } | null;
}

export function ThemeToggle({ className }: { className?: string }) {
	const { setTheme } = useTheme();
	const theme = usePreferredTheme();

	return (
		<div className={cn('bg-muted inline-flex items-center gap-0.5 rounded-lg p-0.5', className)}>
			<ThemeToggleButton
				label="Light mode"
				active={theme === 'light'}
				onClick={() => setTheme('light')}
			>
				<SunIcon size={15} />
			</ThemeToggleButton>
			<ThemeToggleButton
				label="Dark mode"
				active={theme === 'dark'}
				onClick={() => setTheme('dark')}
			>
				<MoonIcon size={15} />
			</ThemeToggleButton>
		</div>
	);
}

function ThemeToggleButton({
	label,
	active,
	onClick,
	children,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				'flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors',
				active
					? 'bg-background text-foreground shadow-sm'
					: 'text-muted-foreground hover:text-foreground',
			)}
		>
			{children}
		</button>
	);
}

export function SidebarFooterActions({ readOnly }: { readOnly?: boolean }) {
	const [auth, setAuth] = useState<AuthMeResponse | null>(null);

	useEffect(() => {
		let cancelled = false;
		fetch('/api/auth/me', { cache: 'no-store' })
			.then(r => (r.ok ? (r.json() as Promise<AuthMeResponse>) : null))
			.then(data => {
				if (!cancelled) setAuth(data);
			})
			.catch(() => {
				if (!cancelled) setAuth(null);
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const showLogout = !!auth?.enabled && !!auth.authenticated;
	const userLabel = auth?.user?.name || auth?.user?.email || undefined;

	return (
		<div className="flex items-center gap-2">
			<Link
				href="https://thezucompany.com"
				target="_blank"
				aria-label="The Zu Company"
				className="flex shrink-0 items-center opacity-80 transition-opacity hover:opacity-100"
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src="/images/zu/logo.svg" alt="The Zu Company" className="h-5 w-auto dark:hidden" />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src="/images/zu/logo-dark.svg"
					alt="The Zu Company"
					className="hidden h-5 w-auto dark:block"
				/>
			</Link>

			<div className="ml-auto flex items-center gap-1">
				{readOnly && (
					<span className="text-primary-foreground bg-primary rounded-full px-2.5 py-0.5 text-xs">
						Read-only
					</span>
				)}

				<Link href="/about">
					<Button size="icon" variant="ghost" aria-label="About">
						<InfoIcon size={18} />
					</Button>
				</Link>

				{showLogout && (
					<form method="POST" action="/api/auth/logout" className="contents">
						<Button
							type="submit"
							size="icon"
							variant="ghost"
							aria-label="Sign out"
							title={userLabel}
						>
							<LogOutIcon size={18} />
						</Button>
					</form>
				)}

				<ThemeToggle />
			</div>
		</div>
	);
}
