'use client';

import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

export function ChangePasswordDialog({
	open,
	onOpenChange,
	recovery = false,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	recovery?: boolean;
}) {
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const reset = () => {
		setCurrentPassword('');
		setNewPassword('');
		setConfirm('');
		setErrorMessage(null);
	};

	const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (submitting) return;
		setErrorMessage(null);

		if (newPassword !== confirm) {
			setErrorMessage('New passwords do not match.');
			return;
		}
		if (newPassword.length < 8) {
			setErrorMessage('Password must be at least 8 characters.');
			return;
		}

		setSubmitting(true);
		try {
			const res = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword }),
			});
			const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
			if (!res.ok || !data.ok) {
				setErrorMessage(data.error || 'Could not change password.');
				setSubmitting(false);
				return;
			}
			toast.success('Password changed');
			reset();
			if (recovery) {
				window.location.reload();
				return;
			}
			onOpenChange(false);
		} catch (err) {
			setErrorMessage(err instanceof Error ? err.message : 'Network error.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={next => {
				if (recovery) return;
				if (!next) reset();
				onOpenChange(next);
			}}
		>
			<DialogContent
				className="sm:max-w-md"
				showCloseButton={!recovery}
				onEscapeKeyDown={recovery ? e => e.preventDefault() : undefined}
				onPointerDownOutside={recovery ? e => e.preventDefault() : undefined}
				onInteractOutside={recovery ? e => e.preventDefault() : undefined}
			>
				<DialogHeader>
					<DialogTitle>{recovery ? 'Set a new password' : 'Change password'}</DialogTitle>
					<DialogDescription>
						{recovery
							? 'You signed in with a temporary recovery password. Choose a new password to continue.'
							: 'Update your own password. Other active sessions will be signed out.'}
					</DialogDescription>
				</DialogHeader>

				<form className="flex flex-col gap-4" onSubmit={onSubmit}>
					<Field label={recovery ? 'Recovery password' : 'Current password'}>
						<Input
							type="password"
							autoComplete={recovery ? 'off' : 'current-password'}
							value={currentPassword}
							onChange={e => setCurrentPassword(e.target.value)}
							autoFocus
						/>
					</Field>
					<Field label="New password">
						<Input
							type="password"
							autoComplete="new-password"
							value={newPassword}
							onChange={e => setNewPassword(e.target.value)}
							placeholder="At least 8 characters"
						/>
					</Field>
					<Field label="Confirm new password">
						<Input
							type="password"
							autoComplete="new-password"
							value={confirm}
							onChange={e => setConfirm(e.target.value)}
						/>
					</Field>

					{errorMessage && (
						<p className="text-destructive text-sm" role="alert">
							{errorMessage}
						</p>
					)}

					<DialogFooter>
						{!recovery && (
							<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
								Cancel
							</Button>
						)}
						<Button
							type="submit"
							disabled={submitting || !currentPassword || newPassword.length === 0}
						>
							{submitting ? 'Saving…' : recovery ? 'Set password' : 'Change password'}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
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
