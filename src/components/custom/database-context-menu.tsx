'use client';

import { ReactNode, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FilePlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { CreateItemDialog } from '@/components/custom/create-item-dialog';
import { ConfirmNameDialog } from '@/components/custom/confirm-name-dialog';
import { dropDatabase } from '@/actions/databaseOperation';
import { useDatabaseFetcher } from '@/components/custom/database-fetcher';
import type { Database } from '@/lib/types/mongo';

interface DatabaseContextMenuProps {
	database: string;
	databases: Database[];
	readOnly?: boolean;
	canDropDatabase?: boolean;
	children: ReactNode;
}

export function DatabaseContextMenu({
	database,
	databases,
	readOnly,
	canDropDatabase,
	children,
}: DatabaseContextMenuProps) {
	const router = useRouter();
	const pathname = usePathname();
	const { reloadData } = useDatabaseFetcher();

	const [showCreate, setShowCreate] = useState(false);
	const [showDropDialog, setShowDropDialog] = useState(false);
	const [isBusy, setIsBusy] = useState(false);

	if (readOnly && !canDropDatabase) {
		return <>{children}</>;
	}

	const handleDrop = async () => {
		setIsBusy(true);
		try {
			const result = await dropDatabase(database);
			if (result.success) {
				toast.success(`Database "${database}" dropped`);
				await reloadData();
				if (decodeURIComponent(pathname).startsWith(`/${database}/`)) {
					router.push('/');
				} else {
					router.refresh();
				}
			} else {
				toast.error(result.error);
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setIsBusy(false);
			setShowDropDialog(false);
		}
	};

	return (
		<>
			<ContextMenu modal={false}>
				<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
				<ContextMenuContent className="w-52">
					{!readOnly && (
						<ContextMenuItem onSelect={() => setShowCreate(true)} disabled={isBusy}>
							<FilePlusIcon />
							Create collection…
						</ContextMenuItem>
					)}
					{canDropDatabase && (
						<>
							{!readOnly && <ContextMenuSeparator />}
							<ContextMenuItem
								variant="destructive"
								onSelect={() => setShowDropDialog(true)}
								disabled={isBusy}
							>
								<Trash2Icon />
								Drop database
							</ContextMenuItem>
						</>
					)}
				</ContextMenuContent>
			</ContextMenu>

			<CreateItemDialog
				key={showCreate ? 'open' : 'closed'}
				open={showCreate}
				onOpenChange={setShowCreate}
				databases={databases}
				initialItemType="collection"
				initialDb={database}
			/>

			<ConfirmNameDialog
				open={showDropDialog}
				onOpenChange={setShowDropDialog}
				title="Drop database"
				description={
					<>
						This permanently deletes the database &quot;{database}&quot; with all of its collections
						and documents. This cannot be undone.
					</>
				}
				expectedName={database}
				confirmLabel="Drop database"
				busy={isBusy}
				onConfirm={handleDrop}
			/>
		</>
	);
}
