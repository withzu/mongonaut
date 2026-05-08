'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle, KeyRound, LockIcon, ShieldCheck } from 'lucide-react';
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
		<div className="min-h-screen w-full flex items-center justify-center px-4 py-10 bg-background">
			<div className="w-full max-w-md flex flex-col items-center gap-6">
				<div className="flex items-center gap-3">
					<img src="/images/logo.svg" alt="Mongonaut" className="w-9 h-9 dark:invert" />
					<span className="text-xl font-semibold tracking-tight">Mongonaut</span>
				</div>

				<Card className="w-full border-[#FFB211]/20 shadow-md">
					<CardHeader>
						<div className="flex items-center gap-2">
							<div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
								<LockIcon className="h-4 w-4 text-primary" />
							</div>
							<div>
								<CardTitle className="text-base">Authentication required</CardTitle>
								<CardDescription className="text-xs">
									Sign in to continue to Mongonaut.
								</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						{error && ERROR_MESSAGES[error] && (
							<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
								<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
								<p>{ERROR_MESSAGES[error]}</p>
							</div>
						)}

						{misconfigured && <MisconfiguredNotice mode={mode} />}

						{!misconfigured && mode === 'STATIC_PASSWORD' && <PasswordForm next={next} />}
						{!misconfigured && mode === 'OIDC' && <OidcLaunch next={next} />}
					</CardContent>
				</Card>

				<p className="text-xs text-muted-foreground text-center max-w-sm">
					{mode === 'STATIC_PASSWORD'
						? 'Static password authentication is enabled by your administrator.'
						: mode === 'OIDC'
							? 'Single sign-on is enabled. You will be redirected to your identity provider.'
							: ''}
				</p>
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
		<form className="flex flex-col gap-3" onSubmit={onSubmit}>
			<label className="flex flex-col gap-1.5">
				<span className="text-xs font-medium text-muted-foreground">Password</span>
				<Input
					type="password"
					autoComplete="current-password"
					autoFocus
					value={password}
					onChange={e => setPassword(e.target.value)}
					placeholder="Enter the configured password"
					disabled={submitting}
				/>
			</label>

			{errorMessage && (
				<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-2.5 text-xs text-destructive">
					<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
					<p>{errorMessage}</p>
				</div>
			)}

			<Button
				type="submit"
				disabled={submitting || password.length === 0}
				className="bg-[#FFB211] hover:bg-[#E5A010] text-black"
			>
				<KeyRound className="h-4 w-4" />
				{submitting ? 'Signing in...' : 'Sign in'}
			</Button>
		</form>
	);
}

function OidcLaunch({ next }: { next: string }) {
	const href = `/api/auth/oidc/start?next=${encodeURIComponent(next)}`;
	return (
		<div className="flex flex-col gap-3">
			<a href={href} className="contents">
				<Button className="w-full bg-[#FFB211] hover:bg-[#E5A010] text-black">
					<ShieldCheck className="h-4 w-4" />
					Continue with single sign-on
				</Button>
			</a>
			<p className="text-xs text-muted-foreground">
				You&apos;ll be redirected to your identity provider to complete the sign-in.
			</p>
		</div>
	);
}

function MisconfiguredNotice({ mode }: { mode: AuthMode }) {
	return (
		<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
			<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
			<div className="space-y-1">
				<p className="font-medium">Authentication is misconfigured.</p>
				<p>
					{mode === 'STATIC_PASSWORD'
						? 'MONGONAUT_AUTH_SECRET and MONGONAUT_AUTH_PASSWORD must both be set.'
						: 'MONGONAUT_AUTH_SECRET, MONGONAUT_OIDC_ISSUER, MONGONAUT_OIDC_CLIENT_ID and MONGONAUT_OIDC_CLIENT_SECRET must all be set.'}
				</p>
				<p>Check your container environment variables and restart Mongonaut.</p>
			</div>
		</div>
	);
}
