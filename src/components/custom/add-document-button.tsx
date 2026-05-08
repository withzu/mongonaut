'use client';

import { useState, useMemo } from 'react';
import { Loader2, PlusIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { addDocument } from '@/actions/databaseOperation';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

export function AddDocumentButton() {
	const params = useParams();
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [jsonInput, setJsonInput] = useState('{\n  \n}');
	const [isLoading, setIsLoading] = useState(false);
	const database = params.database as string;
	const collection = params.collection as string;

	const isValid = useMemo(() => {
		try {
			JSON.parse(jsonInput);
			return true;
		} catch {
			return false;
		}
	}, [jsonInput]);

	const handleAddDocument = async () => {
		if (!isValid) {
			toast.error('Please provide valid JSON before adding the document');
			return;
		}

		try {
			setIsLoading(true);
			const parsedJson = JSON.parse(jsonInput);
			const documentJson = JSON.stringify(parsedJson);

			const result = await addDocument(database, collection, documentJson);

			if (result.success) {
				toast.success('Document successfully added!');
				setOpen(false);
				router.refresh();
			} else {
				toast.error(`Error: ${result.error?.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error(error);
			toast.error('Invalid JSON format');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Button onClick={() => setOpen(true)} className="flex items-center gap-2">
				<PlusIcon size={16} />
				<span>Add document</span>
			</Button>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-4xl">
					<DialogHeader>
						<DialogTitle>Add a new document</DialogTitle>
						<DialogDescription>
							Create a new document for the {collection} collection using JSON format
						</DialogDescription>
					</DialogHeader>

					<div className="h-[500px] border rounded-md">
						<CodeMirror
							value={jsonInput}
							height="500px"
							extensions={[json()]}
							onChange={value => setJsonInput(value)}
							theme={vscodeDark}
							selection={{ anchor: 2, head: 2 }}
							basicSetup={{
								lineNumbers: true,
								highlightActiveLine: true,
								bracketMatching: true,
								autocompletion: true,
								foldGutter: true,
								indentOnInput: true,
							}}
						/>
					</div>

					<DialogFooter className="w-full">
						<div className="flex justify-between w-full">
							{isValid ? (
								<Badge
									variant="outline"
									className="bg-green-500/10 text-green-500 flex items-center gap-1 px-3 py-1"
								>
									<CheckCircle2 size={14} />
									<span>Valid JSON</span>
								</Badge>
							) : (
								<Badge
									variant="outline"
									className="bg-destructive/10 text-destructive flex items-center gap-1 px-3 py-1"
								>
									<AlertCircle size={14} />
									<span>Invalid JSON</span>
								</Badge>
							)}
							<div className="flex gap-2">
								<Button variant="outline" onClick={() => setOpen(false)}>
									Cancel
								</Button>
								<Button
									onClick={handleAddDocument}
									disabled={isLoading || !isValid}
									className="min-w-[120px]"
								>
									{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Add Document
								</Button>
							</div>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
