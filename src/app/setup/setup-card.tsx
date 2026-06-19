'use client';

import { FormEvent, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export function SetupCard() {
	const [email, setEmail] = useState('');
	const [name, setName] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (submitting) return;
		setErrorMessage(null);

		if (password !== confirm) {
			setErrorMessage('Passwords do not match.');
			return;
		}
		if (password.length < 8) {
			setErrorMessage('Password must be at least 8 characters.');
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch('/api/auth/setup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password, name: name || undefined }),
			});
			const data = (await res.json().catch(() => ({}))) as {
				ok?: boolean;
				error?: string;
				redirect?: string;
			};
			if (!res.ok || !data.ok) {
				setErrorMessage(data.error || 'Setup failed.');
				setSubmitting(false);
				return;
			}
			window.location.href = data.redirect || '/';
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Network error.');
			setSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
			<div className="flex w-full max-w-sm flex-col gap-10">
				<div className="flex items-center justify-center gap-2.5">
					<img src="/images/logo.svg" alt="Mongonaut" className="h-12 w-12 dark:invert" />
					<span className="text-2xl font-semibold tracking-tight">Mongonaut</span>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Create the first administrator</CardTitle>
						<CardDescription>
							This one-time setup creates the initial admin account. After this, accounts are
							managed inside Mongonaut.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className="flex flex-col gap-4" onSubmit={onSubmit}>
							<Field label="Email">
								<Input
									type="email"
									autoComplete="username"
									autoFocus
									required
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder="admin@example.com"
									disabled={submitting}
								/>
							</Field>
							<Field label="Name (optional)">
								<Input
									type="text"
									autoComplete="name"
									value={name}
									onChange={e => setName(e.target.value)}
									placeholder="Your name"
									disabled={submitting}
								/>
							</Field>
							<Field label="Password">
								<Input
									type="password"
									autoComplete="new-password"
									required
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder="At least 8 characters"
									disabled={submitting}
								/>
							</Field>
							<Field label="Confirm password">
								<Input
									type="password"
									autoComplete="new-password"
									required
									value={confirm}
									onChange={e => setConfirm(e.target.value)}
									placeholder="Repeat password"
									disabled={submitting}
								/>
							</Field>

							{errorMessage && <Notice>{errorMessage}</Notice>}

							<Button
								type="submit"
								disabled={submitting || !email || password.length === 0}
								className="w-full bg-[#FFB211] text-black hover:bg-[#E5A010]"
							>
								{submitting ? 'Creating…' : 'Create administrator'}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium">{label}</label>
			{children}
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
