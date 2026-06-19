'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { KeyRoundIcon, PencilIcon, PlusIcon, ShieldIcon, TrashIcon, XIcon } from 'lucide-react';
import type { AuthMode } from '@/lib/auth/config';
import type { Grant, GrantAccess, PublicAccount } from '@/lib/auth/accounts';
import {
	createAccountAction,
	deleteAccountAction,
	setAccountPasswordAction,
	updateAccountAction,
} from '@/actions/accountAdmin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

export interface Namespace {
	database: string;
	collections: string[];
}

interface AccountManagerProps {
	initialAccounts: PublicAccount[];
	currentAccountId: string;
	authMode: AuthMode;
	namespaces: Namespace[];
}

export function AccountManager({
	initialAccounts,
	currentAccountId,
	authMode,
	namespaces,
}: AccountManagerProps) {
	const router = useRouter();
	const [createOpen, setCreateOpen] = useState(false);
	const [editing, setEditing] = useState<PublicAccount | null>(null);
	const [resetting, setResetting] = useState<PublicAccount | null>(null);
	const [deleting, setDeleting] = useState<PublicAccount | null>(null);

	const refresh = () => router.refresh();

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between gap-2">
				<div>
					<h1 className="text-lg font-semibold">Accounts &amp; settings</h1>
					<p className="text-muted-foreground text-sm">
						Manage who can access this Mongonaut instance and what they can do.
					</p>
				</div>
				<Button className="flex items-center gap-2" onClick={() => setCreateOpen(true)}>
					<PlusIcon size={16} />
					Add account
				</Button>
			</div>

			<div className="bg-muted/30 flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg px-4 py-3 text-sm">
				<div className="flex items-center gap-2">
					<ShieldIcon size={14} className="text-primary" />
					<span className="text-muted-foreground">Authentication mode:</span>
					<span className="font-medium">{authMode}</span>
				</div>
				<span className="text-muted-foreground text-xs">
					The mode is controlled by the MONGONAUT_AUTH_MODE environment variable.
				</span>
			</div>

			<div className="flex flex-col gap-2">
				{initialAccounts.map(account => (
					<AccountRow
						key={account.id}
						account={account}
						isSelf={account.id === currentAccountId}
						onEdit={() => setEditing(account)}
						onResetPassword={() => setResetting(account)}
						onDelete={() => setDeleting(account)}
					/>
				))}
			</div>

			<AccountFormDialog
				mode="create"
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSaved={refresh}
				namespaces={namespaces}
			/>

			{editing && (
				<AccountFormDialog
					mode="edit"
					account={editing}
					isSelf={editing.id === currentAccountId}
					open={!!editing}
					onOpenChange={open => !open && setEditing(null)}
					onSaved={refresh}
					namespaces={namespaces}
				/>
			)}

			{resetting && (
				<ResetPasswordDialog
					account={resetting}
					open={!!resetting}
					onOpenChange={open => !open && setResetting(null)}
					onSaved={refresh}
				/>
			)}

			<AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete account</AlertDialogTitle>
						<AlertDialogDescription>
							This permanently deletes the account &quot;{deleting?.email}&quot;. This action cannot
							be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={async () => {
								if (!deleting) return;
								const result = await deleteAccountAction(deleting.id);
								if (result.success) {
									toast.success('Account deleted');
									refresh();
								} else {
									toast.error(result.error);
								}
								setDeleting(null);
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}

function AccountRow({
	account,
	isSelf,
	onEdit,
	onResetPassword,
	onDelete,
}: {
	account: PublicAccount;
	isSelf: boolean;
	onEdit: () => void;
	onResetPassword: () => void;
	onDelete: () => void;
}) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
			<div className="min-w-0">
				<div className="flex items-center gap-2">
					<span className="truncate font-medium">{account.name || account.email}</span>
					{account.isAdmin && <Badge variant="outline">Admin</Badge>}
					{account.disabled && (
						<Badge variant="outline" className="text-destructive border-destructive/40">
							Disabled
						</Badge>
					)}
					{isSelf && <Badge variant="secondary">You</Badge>}
				</div>
				<div className="text-muted-foreground truncate text-xs">
					{account.name ? `${account.email} · ` : ''}
					{account.isAdmin
						? 'Full access'
						: `${account.grants.length} grant${account.grants.length === 1 ? '' : 's'}`}
				</div>
			</div>
			<div className="flex shrink-0 items-center gap-1">
				<Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit account">
					<PencilIcon size={16} />
				</Button>
				<Button variant="ghost" size="icon" onClick={onResetPassword} aria-label="Reset password">
					<KeyRoundIcon size={16} />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					onClick={onDelete}
					disabled={isSelf}
					aria-label="Delete account"
					className="text-muted-foreground hover:text-destructive"
				>
					<TrashIcon size={16} />
				</Button>
			</div>
		</div>
	);
}

function AccountFormDialog({
	mode,
	account,
	isSelf,
	open,
	onOpenChange,
	onSaved,
	namespaces,
}: {
	mode: 'create' | 'edit';
	account?: PublicAccount;
	isSelf?: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
	namespaces: Namespace[];
}) {
	const [email, setEmail] = useState(account?.email ?? '');
	const [name, setName] = useState(account?.name ?? '');
	const [password, setPassword] = useState('');
	const [isAdmin, setIsAdmin] = useState(account?.isAdmin ?? false);
	const [disabled, setDisabled] = useState(account?.disabled ?? false);
	const [grants, setGrants] = useState<Grant[]>(account?.grants ?? []);
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		try {
			if (mode === 'create') {
				const result = await createAccountAction({ email, password, name, isAdmin, grants });
				if (result.success) {
					toast.success('Account created');
					onOpenChange(false);
					onSaved();
				} else {
					toast.error(result.error);
				}
			} else if (account) {
				const result = await updateAccountAction(account.id, { name, isAdmin, disabled, grants });
				if (result.success) {
					toast.success('Account updated');
					onOpenChange(false);
					onSaved();
				} else {
					toast.error(result.error);
				}
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>{mode === 'create' ? 'Add account' : 'Edit account'}</DialogTitle>
					<DialogDescription>
						{mode === 'create'
							? 'Create a new account and choose what it may access.'
							: `Editing ${account?.email}`}
					</DialogDescription>
				</DialogHeader>

				<div className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1">
					{mode === 'create' && (
						<>
							<Labeled label="Email">
								<Input
									type="email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									placeholder="user@example.com"
								/>
							</Labeled>
							<Labeled label="Password">
								<Input
									type="password"
									value={password}
									onChange={e => setPassword(e.target.value)}
									placeholder="At least 8 characters"
								/>
							</Labeled>
						</>
					)}
					<Labeled label="Name (optional)">
						<Input
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder="Display name"
						/>
					</Labeled>

					<div className="flex items-center justify-between rounded-md border px-3 py-2">
						<div>
							<p className="text-sm font-medium">Administrator</p>
							<p className="text-muted-foreground text-xs">Full access and account management.</p>
						</div>
						<Switch checked={isAdmin} onCheckedChange={setIsAdmin} disabled={isSelf} />
					</div>

					{mode === 'edit' && (
						<div className="flex items-center justify-between rounded-md border px-3 py-2">
							<div>
								<p className="text-sm font-medium">Disabled</p>
								<p className="text-muted-foreground text-xs">Blocks sign-in and revokes access.</p>
							</div>
							<Switch checked={disabled} onCheckedChange={setDisabled} disabled={isSelf} />
						</div>
					)}

					{!isAdmin && (
						<GrantsEditor grants={grants} onChange={setGrants} namespaces={namespaces} />
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						disabled={saving || (mode === 'create' && (!email || password.length === 0))}
					>
						{mode === 'create' ? 'Create account' : 'Save changes'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

const ALL_COLLECTIONS = '*';

function GrantsEditor({
	grants,
	onChange,
	namespaces,
}: {
	grants: Grant[];
	onChange: (g: Grant[]) => void;
	namespaces: Namespace[];
}) {
	const update = (index: number, patch: Partial<Grant>) => {
		onChange(grants.map((g, i) => (i === index ? { ...g, ...patch } : g)));
	};
	const remove = (index: number) => onChange(grants.filter((_, i) => i !== index));
	const add = () =>
		onChange([
			...grants,
			{ database: namespaces[0]?.database ?? '', collection: ALL_COLLECTIONS, access: 'read' },
		]);

	const databaseOptions = (current: string) => {
		const names = namespaces.map(n => n.database);
		// Keep a grant's current database selectable even if it no longer exists.
		if (current && !names.includes(current)) names.unshift(current);
		return names;
	};

	const collectionOptions = (database: string, current: string) => {
		const ns = namespaces.find(n => n.database === database);
		const names = ns ? [...ns.collections] : [];
		if (current && current !== ALL_COLLECTIONS && !names.includes(current)) names.unshift(current);
		return names;
	};

	return (
		<div className="flex flex-col gap-2">
			<p className="text-sm font-medium">Access grants</p>
			<p className="text-muted-foreground text-xs">
				Grant access per database. Choose &quot;All collections&quot; to cover the whole database.
			</p>
			{grants.length === 0 && (
				<p className="text-muted-foreground rounded-md border border-dashed px-3 py-3 text-xs">
					No grants yet. This account can sign in but cannot read any data.
				</p>
			)}
			{grants.map((grant, index) => (
				<div key={index} className="flex items-center gap-2">
					<Select
						value={grant.database || undefined}
						onValueChange={value =>
							// Reset the collection when the database changes.
							update(index, { database: value, collection: ALL_COLLECTIONS })
						}
					>
						<SelectTrigger className="flex-1">
							<SelectValue placeholder="Database" />
						</SelectTrigger>
						<SelectContent>
							{databaseOptions(grant.database).map(name => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={grant.collection}
						onValueChange={value => update(index, { collection: value })}
						disabled={!grant.database}
					>
						<SelectTrigger className="flex-1">
							<SelectValue placeholder="Collection" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL_COLLECTIONS}>All collections</SelectItem>
							{collectionOptions(grant.database, grant.collection).map(name => (
								<SelectItem key={name} value={name}>
									{name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select
						value={grant.access}
						onValueChange={value => update(index, { access: value as GrantAccess })}
					>
						<SelectTrigger className="w-[130px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="read">Read</SelectItem>
							<SelectItem value="readWrite">Read &amp; write</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => remove(index)}
						aria-label="Remove grant"
					>
						<XIcon size={16} />
					</Button>
				</div>
			))}
			<Button variant="outline" size="sm" onClick={add} className="self-start">
				<PlusIcon size={14} />
				Add grant
			</Button>
		</div>
	);
}

function ResetPasswordDialog({
	account,
	open,
	onOpenChange,
	onSaved,
}: {
	account: PublicAccount;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSaved: () => void;
}) {
	const [password, setPassword] = useState('');
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		setSaving(true);
		try {
			const result = await setAccountPasswordAction(account.id, password);
			if (result.success) {
				toast.success('Password updated');
				onOpenChange(false);
				onSaved();
			} else {
				toast.error(result.error);
			}
		} finally {
			setSaving(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Reset password</DialogTitle>
					<DialogDescription>
						Set a new password for {account.email}. This signs the account out everywhere.
					</DialogDescription>
				</DialogHeader>
				<Labeled label="New password">
					<Input
						type="password"
						value={password}
						onChange={e => setPassword(e.target.value)}
						placeholder="At least 8 characters"
						autoFocus
					/>
				</Labeled>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving || password.length === 0}>
						Update password
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex flex-col gap-2">
			<label className="text-sm font-medium">{label}</label>
			{children}
		</div>
	);
}
