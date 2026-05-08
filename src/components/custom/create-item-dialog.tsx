'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createCollection, createDatabase } from '@/actions/databaseOperation';
import type { Database } from '@/lib/types/mongo';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useDatabaseFetcher } from './database-fetcher';

type ItemType = 'database' | 'collection';

interface CreateItemDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	databases: Database[];
	initialItemType?: ItemType;
}

export function CreateItemDialog({
	open,
	onOpenChange,
	databases,
	initialItemType = 'database',
}: CreateItemDialogProps) {
	const { reloadData } = useDatabaseFetcher();
	const [selectedItemType, setSelectedItemType] = useState<ItemType>(initialItemType);
	const [dbName, setDbName] = useState('');
	const [collectionName, setCollectionName] = useState('');
	const [selectedDb, setSelectedDb] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	const itemType: ItemType = databases.length === 0 ? 'database' : selectedItemType;

	const handleCreate = async () => {
		setIsCreating(true);
		try {
			if (itemType === 'database') {
				if (!dbName) {
					toast.error('Please enter a database name.');
					return;
				}
				const result = await createDatabase(dbName);
				if (result.success) {
					toast.success(`Database "${dbName}" created successfully!`);
					await reloadData();
					onOpenChange(false);
				} else {
					toast.error(String(result.error) || 'Failed to create database');
				}
			} else {
				if (!selectedDb || !collectionName) {
					toast.error('Please select a database and enter a collection name.');
					return;
				}
				const result = await createCollection(selectedDb, collectionName);
				if (result.success) {
					toast.success(`Collection "${collectionName}" in "${selectedDb}" created successfully!`);
					await reloadData();
					onOpenChange(false);
				} else {
					toast.error(String(result.error) || 'Failed to create collection');
				}
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
			toast.error(`Error: ${errorMessage}`);
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={open => {
				if (!open) {
					setDbName('');
					setCollectionName('');
					setSelectedDb('');
				}
				onOpenChange(open);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create new</DialogTitle>
					<DialogDescription>
						{databases.length === 0
							? 'Create your first database to get started.'
							: 'Create a new database or collection to store your data.'}
					</DialogDescription>
				</DialogHeader>

				{databases.length > 0 ? (
					<Tabs
						defaultValue={itemType}
						className="w-full"
						onValueChange={(value: string) => setSelectedItemType(value as ItemType)}
					>
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="database">Database</TabsTrigger>
							<TabsTrigger value="collection">Collection</TabsTrigger>
						</TabsList>
						<div className="mt-4 space-y-4">
							<TabsContent value="database">
								<div className="space-y-2">
									<label htmlFor="dbName" className="text-sm font-medium">
										Database Name
									</label>
									<Input
										id="dbName"
										value={dbName}
										onChange={e => setDbName(e.target.value)}
										placeholder="e.g. my_new_database"
									/>
								</div>
							</TabsContent>
							<TabsContent value="collection">
								<div className="space-y-4">
									<div className="space-y-2">
										<label htmlFor="selectDb" className="text-sm font-medium">
											Select Database
										</label>
										<Select value={selectedDb} onValueChange={setSelectedDb}>
											<SelectTrigger id="selectDb" className="w-full">
												<SelectValue placeholder="Choose a database" />
											</SelectTrigger>
											<SelectContent className="w-full">
												{databases.map(db => (
													<SelectItem key={db.name} value={db.name}>
														{db.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<label htmlFor="collectionName" className="text-sm font-medium">
											Collection Name
										</label>
										<Input
											id="collectionName"
											value={collectionName}
											onChange={e => setCollectionName(e.target.value)}
											placeholder="e.g. users"
										/>
									</div>
								</div>
							</TabsContent>
						</div>
					</Tabs>
				) : (
					<div className="space-y-2 mt-4">
						<label htmlFor="dbName" className="text-sm font-medium">
							Database Name
						</label>
						<Input
							id="dbName"
							value={dbName}
							onChange={e => setDbName(e.target.value)}
							placeholder="e.g. my_new_database"
						/>
					</div>
				)}

				<DialogFooter className="mt-6">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleCreate} disabled={isCreating}>
						{isCreating ? 'Creating...' : `Create ${itemType}`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
