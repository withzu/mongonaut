'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectionError({ error }: { error: string }) {
	return (
		<div className="flex-1 flex items-center justify-center p-4" role="alert">
			<Card className="w-full max-w-md mx-auto border-destructive/50">
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertCircle className="h-5 w-5 text-destructive" />
						<CardTitle>Could not reach MongoDB</CardTitle>
					</div>
					<CardDescription>Mongonaut could not read the database list.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Card className="bg-muted/50">
						<CardContent className="p-3">
							<code className="text-xs text-foreground font-mono break-all">{error}</code>
						</CardContent>
					</Card>

					<div className="text-sm text-muted-foreground">
						<p>Please check:</p>
						<ul className="list-disc list-inside mt-2 space-y-1">
							<li>
								<code className="font-mono text-xs">MONGO_CONNECTION_URL</code> points at the right
								host and is reachable from inside the container
							</li>
							<li>MongoDB is running and listening on the expected port</li>
							<li>The credentials in the connection string are valid</li>
							<li>The MongoDB user may list databases and read the data</li>
						</ul>
					</div>

					<Button
						variant="default"
						className="w-full cursor-pointer"
						onClick={() => window.location.reload()}
					>
						<RefreshCw className="mr-2 h-4 w-4" />
						Try again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
