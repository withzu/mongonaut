'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { InfoIcon, KeyRoundIcon, LogOutIcon, MoonIcon, SettingsIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { ChangePasswordDialog } from '@/components/custom/change-password-dialog';
import { getAvailableUpdate } from '@/actions/updateCheck';
import { usePreferredTheme } from '@/hooks/use-preferred-theme';
import { fetchAuthMe, type AuthMeResponse } from '@/lib/auth/me-client';
import type { AvailableUpdate } from '@/lib/update-check';
import { cn } from '@/lib/utils';

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

export function SidebarFooterActions({
	readOnly,
	isAccountAdmin,
}: {
	readOnly?: boolean;
	isAccountAdmin?: boolean;
}) {
	const [auth, setAuth] = useState<AuthMeResponse | null>(null);
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [update, setUpdate] = useState<AvailableUpdate | null>(null);

	useEffect(() => {
		let cancelled = false;
		void fetchAuthMe().then(data => {
			if (!cancelled) setAuth(data);
		});
		void getAvailableUpdate()
			.then(data => {
				if (!cancelled) setUpdate(data);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	const showLogout = !!auth?.enabled && !!auth.authenticated;
	const canChangeOwnPassword = auth?.mode === 'ACCOUNT' && !!auth.authenticated;
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

				{isAccountAdmin && (
					<Button size="icon" variant="ghost" aria-label="Accounts and settings" asChild>
						<Link href="/admin" prefetch={false}>
							<SettingsIcon size={18} />
						</Link>
					</Button>
				)}

				<Button
					size="icon"
					variant="ghost"
					aria-label={
						update ? `About Mongonaut, version ${update.version} is available` : 'About Mongonaut'
					}
					title={update ? `Mongonaut ${update.version} is available` : undefined}
					className="relative"
					asChild
				>
					<Link href="/about" prefetch={false}>
						<InfoIcon size={18} />
						{update && (
							<span
								aria-hidden="true"
								className="bg-brand ring-sidebar absolute top-1.5 right-1.5 size-1.5 rounded-full ring-2"
							/>
						)}
					</Link>
				</Button>

				{canChangeOwnPassword && (
					<Button
						size="icon"
						variant="ghost"
						aria-label="Change password"
						onClick={() => setShowChangePassword(true)}
					>
						<KeyRoundIcon size={18} />
					</Button>
				)}

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

			<ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
		</div>
	);
}
