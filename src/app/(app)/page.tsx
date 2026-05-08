import { DatabaseIcon } from 'lucide-react';

export default function Home() {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center text-center p-4">
			<div className="max-w-md flex flex-col items-center gap-2">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
					<DatabaseIcon className="h-6 w-6 text-primary" />
				</div>
				<h2 className="text-2xl font-semibold tracking-tight">Welcome to Mongonaut</h2>
				<p className="text-muted-foreground">
					Select a collection from the sidebar to view and manage your MongoDB data.
				</p>
				<div className="mt-4 flex items-center text-xs text-muted-foreground">
					<span>
						Use the sidebar navigation on the left to browse your databases and collections
					</span>
				</div>
			</div>
		</div>
	);
}
