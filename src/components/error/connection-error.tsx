'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ConnectionError({ error }: { error: string }) {
	return (
		<div className="bg-background flex flex-1 items-center justify-center p-4" role="alert">
			<Card className="w-full max-w-md mx-auto">
				<CardHeader>
					<div className="flex items-center gap-2">
						<AlertCircle className="text-danger-mark size-5" />
						<CardTitle>Could not reach MongoDB</CardTitle>
					</div>
					<CardDescription>Mongonaut could not read the database list.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Card className="bg-background rounded-md py-0">
						<CardContent className="p-3">
							<code className="text-xs text-foreground font-mono break-all">{error}</code>
						</CardContent>
					</Card>

					<div className="text-muted-foreground text-sm leading-paragraph">
						<p>Please check:</p>
						<ul className="mt-2 list-disc space-y-1 pl-5">
							<li>
								<code className="font-mono text-xs">MONGO_CONNECTION_URL</code> points at the right
								host and is reachable from inside the container
							</li>
							<li>MongoDB is running and listening on the expected port</li>
							<li>The credentials in the connection string are valid</li>
							<li>The MongoDB user may list databases and read the data</li>
						</ul>
					</div>

					<Button variant="default" className="w-full" onClick={() => window.location.reload()}>
						<RefreshCw className="size-4" />
						Try again
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
