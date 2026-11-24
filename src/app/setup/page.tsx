import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { Banner } from '@/components/ui/banner';
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
					<Image
						src="/images/logo.svg"
						alt=""
						aria-hidden="true"
						width={48}
						height={48}
						className="h-12 w-12 dark:invert"
						priority
					/>
					<span className="text-xl font-semibold">Mongonaut</span>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Setup unavailable</CardTitle>
						<CardDescription>
							Authentication is misconfigured, so the initial setup cannot run.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Banner variant="error">
							<p className="font-semibold">MONGONAUT_AUTH_SECRET is not set.</p>
							<p>It must be set when MONGONAUT_AUTH_MODE=ACCOUNT.</p>
							<p>Set it in the container environment and restart Mongonaut.</p>
						</Banner>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
