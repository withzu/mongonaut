'use client';

import {
	ExternalLinkIcon,
	InfoIcon,
	LogOutIcon,
	LucideIcon,
	SettingsIcon,
	SunMoonIcon,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import type { AuthMode } from '@/lib/auth/config';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn, usePreferredTheme } from '@/lib/utils';

interface AuthMeResponse {
	mode: AuthMode;
	enabled: boolean;
	authenticated: boolean;
	user: { subject: string; mode: AuthMode; email: string | null; name: string | null } | null;
}

export function SettingsButton() {
	const { setTheme } = useTheme();
	const theme = usePreferredTheme();
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

	const toggleTheme = (dark: boolean) => {
		setTheme(!dark ? 'light' : 'dark');
	};

	const showLogout = !!auth?.enabled && !!auth.authenticated;
	const userLabel = auth?.user?.name || auth?.user?.email || null;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button size="icon" variant="ghost">
					<SettingsIcon />
					<span className="sr-only">Settings</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="p-1.5 grid gap-1 w-56">
				<SettingsMenuItem icon={SunMoonIcon} label="Dark Mode">
					<Switch checked={theme === 'dark'} onCheckedChange={e => toggleTheme(e)} />
				</SettingsMenuItem>
				<SettingsMenuItem icon={InfoIcon} label="About" href="/about" />

				{showLogout && (
					<>
						<Separator className="my-1" />
						{userLabel && (
							<div className="px-2 pt-1 pb-0.5 text-[10px] uppercase tracking-wide text-muted-foreground truncate">
								{userLabel}
							</div>
						)}
						<LogoutForm />
					</>
				)}
			</PopoverContent>
		</Popover>
	);
}

function LogoutForm() {
	return (
		<form method="POST" action="/api/auth/logout" className="contents">
			<button
				type="submit"
				className="flex justify-between gap-2 text-sm p-2 rounded-md cursor-pointer hover:bg-accent/50 text-left w-full"
			>
				<div className="flex gap-2">
					<LogOutIcon size={16} className="text-muted-foreground my-auto" />
					<p>Sign out</p>
				</div>
			</button>
		</form>
	);
}

export function SettingsMenuItem(props: {
	icon: LucideIcon;
	label: string;
	href?: string;
	external?: boolean;
	children?: string | React.ReactNode | React.ReactNode[];
}) {
	return (
		<Link href={props.href ?? ''}>
			<div
				className={cn(
					'flex justify-between gap-2 text-sm p-2 cursor-default',
					props.href && 'hover:bg-accent/50 rounded-md cursor-pointer',
				)}
			>
				<div className="flex gap-2">
					<props.icon size={16} className="text-muted-foreground my-auto" />
					<p>{props.label}</p>
				</div>

				{props.children ??
					(props.external && (
						<ExternalLinkIcon className="my-auto text-muted-foreground" size={14} />
					))}
			</div>
		</Link>
	);
}
