import { Suspense, type ReactNode } from 'react';
import { ArrowUpRightIcon, BookOpenIcon, BugIcon, StarIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getAvailableUpdate } from '@/actions/updateCheck';
import { CenteredContainer } from '@/components/custom/app-container';
import { GithubIcon } from '@/components/custom/github-icon';
import { LogoMark } from '@/components/custom/logo-mark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getAppVersion } from '@/lib/version';

interface ResourceLink {
	href: string;
	title: string;
	description: string;
	icon: ReactNode;
}

const LINKS: ResourceLink[] = [
	{
		href: 'https://mongonaut.org',
		title: 'Documentation',
		description: 'Learn how to use Mongonaut',
		icon: <BookOpenIcon aria-hidden="true" />,
	},
	{
		href: 'https://github.com/withzu/mongonaut',
		title: 'GitHub repository',
		description: 'View source code and contribute',
		icon: <GithubIcon aria-hidden="true" />,
	},
	{
		href: 'https://github.com/withzu/mongonaut',
		title: 'Star on GitHub',
		description: 'Show your support',
		icon: <StarIcon aria-hidden="true" />,
	},
	{
		href: 'https://github.com/withzu/mongonaut/issues',
		title: 'Report issues',
		description: 'Help us improve',
		icon: <BugIcon aria-hidden="true" />,
	},
];

function ResourceTile({ link }: { link: ResourceLink }) {
	return (
		<Link
			href={link.href}
			target="_blank"
			rel="noreferrer noopener"
			className="group/tile focus-row bg-background hover:bg-hover active:bg-pressed flex items-center gap-3 p-4 transition-colors"
		>
			<span className="bg-brand-soft text-brand-soft-foreground flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4">
				{link.icon}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block text-sm font-semibold">{link.title}</span>
				<span className="text-muted-foreground group-hover/tile:text-selection-secondary block text-xs">
					{link.description}
				</span>
			</span>
			<ArrowUpRightIcon
				className="text-muted-foreground group-hover/tile:text-foreground size-4 shrink-0"
				aria-hidden="true"
			/>
		</Link>
	);
}

async function UpdateNotice() {
	const update = await getAvailableUpdate();
	if (!update) return null;

	return (
		<Link
			href={update.url}
			target="_blank"
			rel="noreferrer noopener"
			className="text-link text-sm tabular-nums underline-offset-2 hover:underline"
		>
			Version {update.version} available
		</Link>
	);
}

export default function AboutPage() {
	return (
		<CenteredContainer>
			<div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
				<header className="flex flex-col items-center text-center">
					<div className="bg-chrome mb-4 flex size-20 items-center justify-center rounded-lg border">
						<LogoMark className="h-12" priority />
					</div>
					<h1 className="text-xl font-semibold">Mongonaut</h1>
					<p className="text-muted-foreground leading-paragraph mt-1 text-sm">
						A MongoDB management interface that runs as a web service next to your database.
					</p>
					<div className="mt-3 flex flex-wrap items-center justify-center gap-2">
						<Badge variant="secondary" className="tabular-nums">
							v{getAppVersion()}
						</Badge>
						<Badge variant="outline">Beta release</Badge>
						<Badge variant="outline">MIT license</Badge>
						<Suspense fallback={null}>
							<UpdateNotice />
						</Suspense>
					</div>
				</header>

				<section
					aria-label="Resources"
					className="bg-border mt-3 grid gap-px overflow-hidden rounded-lg border md:grid-cols-2"
				>
					{LINKS.map(link => (
						<ResourceTile key={link.title} link={link} />
					))}
				</section>

				<section className="bg-chrome flex flex-col items-start gap-5 rounded-lg border p-5 md:flex-row md:items-center">
					<Image
						src="/images/zu/logo.svg"
						alt="The Zu Company"
						width={687}
						height={338}
						className="-ml-2 h-12 w-auto shrink-0 md:ml-0 dark:hidden"
					/>
					<Image
						src="/images/zu/logo-dark.svg"
						alt="The Zu Company"
						width={687}
						height={338}
						className="-ml-2 hidden h-12 w-auto shrink-0 md:ml-0 dark:block"
					/>
					<div className="min-w-0 flex-1">
						<h2 className="text-sm font-semibold">A The Zu Company product</h2>
						<p className="text-muted-foreground leading-paragraph mt-1 text-sm">
							Mongonaut is developed and maintained by The Zu Company.
						</p>
					</div>
					<Button className="shrink-0" asChild>
						<Link href="https://thezucompany.com" target="_blank" rel="noreferrer noopener">
							Visit website
							<ArrowUpRightIcon aria-hidden="true" />
						</Link>
					</Button>
				</section>
			</div>
		</CenteredContainer>
	);
}
