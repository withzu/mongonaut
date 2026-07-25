import { Github, BookOpen, Code, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { AppContainer } from '@/components/custom/app-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { getAppVersion } from '@/lib/version';

interface ResourceLink {
	href: string;
	title: string;
	description: string;
	icon: React.ReactNode;
}

const DOCS_LINKS: ResourceLink[] = [
	{
		href: 'https://mongonaut.org',
		title: 'Documentation',
		description: 'Learn how to use Mongonaut',
		icon: <BookOpen className="w-4 h-4 text-muted-foreground" aria-hidden="true" />,
	},
	{
		href: 'https://github.com/withzu/mongonaut',
		title: 'GitHub Repository',
		description: 'View source code & contribute',
		icon: <Github className="w-4 h-4 text-muted-foreground" aria-hidden="true" />,
	},
];

const COMMUNITY_LINKS: ResourceLink[] = [
	{
		href: 'https://github.com/withzu/mongonaut',
		title: 'Star on GitHub',
		description: 'Show your support',
		icon: <Star className="w-4 h-4 text-muted-foreground" aria-hidden="true" />,
	},
	{
		href: 'https://github.com/withzu/mongonaut/issues',
		title: 'Report Issues',
		description: 'Help us improve',
		icon: <Code className="w-4 h-4 text-muted-foreground" aria-hidden="true" />,
	},
];

function ResourceButton({ link }: { link: ResourceLink }) {
	return (
		<Button
			variant="ghost"
			className="w-full justify-between h-auto py-3 px-4 hover:bg-accent"
			asChild
		>
			<Link href={link.href} target="_blank" rel="noreferrer noopener">
				<span className="flex items-center gap-3">
					{link.icon}
					<span className="flex flex-col items-start">
						<span className="text-sm font-medium">{link.title}</span>
						<span className="text-xs text-muted-foreground">{link.description}</span>
					</span>
				</span>
				<ExternalLink className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
			</Link>
		</Button>
	);
}

export default function AboutPage() {
	return (
		<AppContainer>
			<div className="mx-auto w-full">
				<div className="flex flex-col gap-8 w-full">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div className="flex items-center gap-4">
							<Image
								src="/images/logo.svg"
								alt=""
								aria-hidden="true"
								width={48}
								height={48}
								className="w-12 h-12 dark:invert"
							/>
							<div>
								<h1 className="text-2xl font-bold">Mongonaut</h1>
								<div className="flex items-center gap-2 mt-1">
									<Badge variant="secondary">v{getAppVersion()}</Badge>
									<span className="text-sm text-muted-foreground">Beta Release</span>
								</div>
							</div>
						</div>
						<Button variant="outline" className="gap-2" asChild>
							<Link
								href="https://github.com/withzu/mongonaut"
								target="_blank"
								rel="noreferrer noopener"
							>
								<Image
									src="/images/github-mark.svg"
									alt=""
									aria-hidden="true"
									width={16}
									height={16}
									className="w-4 h-4 dark:invert"
								/>
								View on GitHub
							</Link>
						</Button>
					</div>

					<div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-[#FFB211]/10 via-background to-amber-400/10">
						<div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
						<div className="relative py-12 px-8">
							<div className="flex flex-col items-center gap-6">
								<div className="flex items-center justify-center py-4 px-8 rounded-xl bg-background/60 backdrop-blur-sm border border-[#FFB211]/20 shadow-lg">
									<Image
										src="/images/zu/logo.svg"
										alt="The Zu Company"
										width={160}
										height={64}
										className="h-16 w-auto dark:hidden"
									/>
									<Image
										src="/images/zu/logo-dark.svg"
										alt="The Zu Company"
										width={160}
										height={64}
										className="h-16 w-auto hidden dark:block"
									/>
								</div>

								<div className="flex flex-col items-center text-center space-y-3 max-w-2xl">
									<h2 className="text-lg font-semibold">A The Zu Company Product</h2>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Mongonaut is proudly developed and maintained by{' '}
										<span className="font-semibold text-foreground">The Zu Company</span>, building
										innovative tools for developers and data enthusiasts.
									</p>
									<div className="flex items-center gap-3 pt-3">
										<Button
											variant="default"
											className="gap-2 bg-[#FFB211] hover:bg-[#E5A010] text-black"
											asChild
										>
											<Link
												href="https://thezucompany.com"
												target="_blank"
												rel="noreferrer noopener"
											>
												Visit The Zu Company
												<ExternalLink className="w-4 h-4" aria-hidden="true" />
											</Link>
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<Card className="p-6">
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<BookOpen
										className="w-5 h-5 text-blue-600 dark:text-blue-400"
										aria-hidden="true"
									/>
									<h2 className="font-semibold">Documentation &amp; Resources</h2>
								</div>
								<div className="grid gap-2">
									{DOCS_LINKS.map(link => (
										<ResourceButton key={link.title} link={link} />
									))}
								</div>
							</div>
						</Card>

						<Card className="p-6">
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<Star className="w-5 h-5 text-brand" aria-hidden="true" />
									<h2 className="font-semibold">Community</h2>
								</div>
								<div className="grid gap-2">
									{COMMUNITY_LINKS.map(link => (
										<ResourceButton key={link.title} link={link} />
									))}
								</div>
							</div>
						</Card>
					</div>

					<div className="rounded-lg border bg-muted/50 p-6">
						<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
							<div className="space-y-1">
								<h3 className="font-medium">Open Source MongoDB Management</h3>
								<p className="text-sm text-muted-foreground">
									Free, powerful, and built for the modern web
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Badge variant="outline">MIT License</Badge>
								<Badge variant="outline">Open Source</Badge>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppContainer>
	);
}
