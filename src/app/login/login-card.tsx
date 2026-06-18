'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { AuthMode } from '@/lib/auth/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface LoginCardProps {
	mode: AuthMode;
	misconfigured: boolean;
	next: string;
	error?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
	provider_error: 'The identity provider rejected the login.',
	invalid_callback: 'The login response was invalid. Please try again.',
	state_missing: 'Your login session expired. Please try again.',
	state_expired: 'Your login session expired. Please try again.',
	state_mismatch: 'Login state mismatch. Please try again.',
	token_exchange_failed: 'Could not exchange the authorization code with the provider.',
	token_verification_failed: 'The identity token returned by the provider could not be verified.',
	email_not_allowed: 'Your account is not allowed to access this Mongonaut instance.',
	oidc_disabled: 'Single sign-on is not enabled for this instance.',
};

export function LoginCard({ mode, misconfigured, next, error }: LoginCardProps) {
	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
			<div className="flex w-full max-w-sm flex-col gap-10">
				<div className="flex items-center justify-center gap-2.5">
					<img src="/images/logo.svg" alt="Mongonaut" className="h-12 w-12 dark:invert" />
					<span className="text-2xl font-semibold tracking-tight">Mongonaut</span>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Authentication required</CardTitle>
						<CardDescription>Sign in to continue.</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{error && ERROR_MESSAGES[error] && <Notice>{ERROR_MESSAGES[error]}</Notice>}

						{misconfigured && <MisconfiguredNotice mode={mode} />}

						{!misconfigured && mode === 'STATIC_PASSWORD' && <PasswordForm next={next} />}
						{!misconfigured && mode === 'OIDC' && <OidcLaunch next={next} />}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function PasswordForm({ next }: { next: string }) {
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (submitting) return;
		setSubmitting(true);
		setErrorMessage(null);
		try {
			const url = `/api/auth/login?next=${encodeURIComponent(next)}`;
			const res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password }),
			});
			const data = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				error?: string;
				redirect?: string;
			};
			if (!res.ok || !data.ok) {
				setErrorMessage(data.error || 'Login failed.');
				setSubmitting(false);
				return;
			}
			window.location.href = data.redirect || next || '/';
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Network error.');
			setSubmitting(false);
		}
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={onSubmit}>
			<div className="flex flex-col gap-2">
				<label htmlFor="password" className="text-sm font-medium">
					Password
				</label>
				<Input
					id="password"
					type="password"
					autoComplete="current-password"
					autoFocus
					value={password}
					onChange={e => setPassword(e.target.value)}
					placeholder="Enter the configured password"
					disabled={submitting}
				/>
			</div>

			{errorMessage && <Notice>{errorMessage}</Notice>}

			<Button
				type="submit"
				disabled={submitting || password.length === 0}
				className="w-full bg-[#FFB211] text-black hover:bg-[#E5A010]"
			>
				{submitting ? 'Signing in…' : 'Sign in'}
			</Button>
		</form>
	);
}

function OidcLaunch({ next }: { next: string }) {
	const href = `/api/auth/oidc/start?next=${encodeURIComponent(next)}`;
	return (
		<div className="flex flex-col gap-3">
			<a href={href} className="contents">
				<Button className="w-full bg-[#FFB211] text-black hover:bg-[#E5A010]">
					Continue with single sign-on
				</Button>
			</a>
			<p className="text-sm text-muted-foreground">
				You&apos;ll be redirected to your identity provider to complete the sign-in.
			</p>
		</div>
	);
}

function Notice({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
			<AlertCircle className="mt-0.5 size-4 shrink-0" />
			<div className="space-y-1">{children}</div>
		</div>
	);
}

function MisconfiguredNotice({ mode }: { mode: AuthMode }) {
	return (
		<Notice>
			<p className="font-medium">Authentication is misconfigured.</p>
			<p>
				{mode === 'STATIC_PASSWORD'
					? 'MONGONAUT_AUTH_SECRET and MONGONAUT_AUTH_PASSWORD must both be set.'
					: 'MONGONAUT_AUTH_SECRET, MONGONAUT_OIDC_ISSUER, MONGONAUT_OIDC_CLIENT_ID and MONGONAUT_OIDC_CLIENT_SECRET must all be set.'}
			</p>
			<p>Check your container environment variables and restart Mongonaut.</p>
		</Notice>
	);
}
