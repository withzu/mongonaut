'use client';

import { useId, useState, type ReactNode } from 'react';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';

export function ConfirmNameDialog({
	open,
	onOpenChange,
	title,
	description,
	expectedName,
	confirmLabel,
	busy,
	onConfirm,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: ReactNode;
	expectedName: string;
	confirmLabel: string;
	busy?: boolean;
	onConfirm: () => void;
}) {
	const inputId = useId();
	const [value, setValue] = useState('');
	const matches = value.trim() === expectedName;

	return (
		<AlertDialog
			open={open}
			onOpenChange={next => {
				if (!next) setValue('');
				onOpenChange(next);
			}}
		>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex flex-col gap-2">
					<label htmlFor={inputId} className="text-sm font-medium">
						Type <span className="font-mono">{expectedName}</span> to confirm
					</label>
					<Input
						id={inputId}
						value={value}
						onChange={event => setValue(event.target.value)}
						autoComplete="off"
						autoFocus
					/>
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={event => {
							if (!matches) {
								event.preventDefault();
								return;
							}
							setValue('');
							onConfirm();
						}}
						disabled={busy || !matches}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
