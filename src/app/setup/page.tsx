import { notFound, redirect } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { getAuthConfig } from '@/lib/auth/config';
import { countAccounts } from '@/lib/auth/accounts';
import { SetupCard } from '@/app/setup/setup-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
	const cfg = getAuthConfig();

	if (cfg.mode !== 'ACCOUNT') {
		notFound();
	}

	if (!cfg.secret) {
		return <SetupMisconfigured />;
	}

	if ((await countAccounts()) > 0) {
		redirect('/login');
	}

	return <SetupCard />;
}

function SetupMisconfigured() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
			<div className="flex w-full max-w-sm flex-col gap-10">
				<div className="flex items-center justify-center gap-2.5">
					<img src="/images/logo.svg" alt="Mongonaut" className="h-12 w-12 dark:invert" />
					<span className="text-2xl font-semibold tracking-tight">Mongonaut</span>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Setup unavailable</CardTitle>
						<CardDescription>
							Authentication is misconfigured, so the initial setup cannot run.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
							<AlertCircle className="mt-0.5 size-4 shrink-0" />
							<div className="space-y-1">
								<p className="font-medium">MONGONAUT_AUTH_SECRET is not set.</p>
								<p>It must be set when MONGONAUT_AUTH_MODE=ACCOUNT.</p>
								<p>Set it in the container environment and restart Mongonaut.</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
