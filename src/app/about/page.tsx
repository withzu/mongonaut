'use client';

import { Github, BookOpen, Code, Star, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { AppContainer } from '@/components/custom/app-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import packageJson from '../../../package.json';

export default function Home() {
	return (
		<AppContainer>
			<div className="w-full mx-auto p-4">
				<div className="flex flex-col gap-8 w-full">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<img src="/images/logo.svg" alt="Mongonaut" className="w-12 h-12 dark:invert" />
							<div>
								<h1 className="text-2xl font-bold">Mongonaut</h1>
								<div className="flex items-center gap-2 mt-1">
									<Badge variant="secondary">v{packageJson.version}</Badge>
									<span className="text-sm text-muted-foreground">Beta Release</span>
								</div>
							</div>
						</div>
						<Button variant="outline" className="gap-2" asChild>
							<Link href="https://github.com/withzu/mongonaut" target="_blank">
								<img src="/images/github-mark.svg" alt="GitHub" className="w-4 h-4 dark:invert" />
								View on GitHub
							</Link>
						</Button>
					</div>

					<div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-[#FFB211]/10 via-background to-amber-400/10">
						<div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(white,transparent_85%)]" />
						<div className="relative py-12 px-8">
							<div className="flex flex-col items-center gap-6">
								<div className="flex items-center justify-center py-4 px-8 rounded-xl bg-background/60 backdrop-blur-sm border border-[#FFB211]/20 shadow-lg">
									<img
										src="/images/zu/logo.svg"
										alt="The Zu Company"
										className="h-16 w-auto dark:hidden"
									/>
									<img
										src="/images/zu/logo-dark.svg"
										alt="The Zu Company"
										className="h-16 w-auto hidden dark:block"
									/>
								</div>

								<div className="flex flex-col items-center text-center space-y-3 max-w-2xl">
									<div className="flex items-center gap-2.5">
										<h2 className="text-lg font-semibold">Powered by The Zu Company</h2>
									</div>
									<p className="text-sm text-muted-foreground leading-relaxed">
										Mongonaut is proudly developed and maintained by{' '}
										<span className="font-semibold text-foreground">The Zu Company</span> – building
										innovative tools for developers and data enthusiasts.
									</p>
									<div className="flex items-center gap-3 pt-3">
										<Button
											variant="default"
											className="gap-2 bg-[#FFB211] hover:bg-[#E5A010] text-black"
											asChild
										>
											<Link href="https://thezucompany.com" target="_blank">
												Visit The Zu Company
												<ExternalLink className="w-4 h-4" />
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
									<BookOpen className="w-5 h-5 text-blue-500" />
									<h2 className="font-semibold">Documentation & Resources</h2>
								</div>
								<div className="grid gap-2">
									<Link href="https://mongonaut.org" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-between h-auto py-3 px-4 hover:bg-accent"
										>
											<div className="flex items-center gap-3">
												<BookOpen className="w-4 h-4 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">Documentation</span>
													<span className="text-xs text-muted-foreground">
														Learn how to use Mongonaut
													</span>
												</div>
											</div>
											<ExternalLink className="w-4 h-4 text-muted-foreground" />
										</Button>
									</Link>
									<Link href="https://github.com/withzu/mongonaut" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-between h-auto py-3 px-4 hover:bg-accent"
										>
											<div className="flex items-center gap-3">
												<Github className="w-4 h-4 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">GitHub Repository</span>
													<span className="text-xs text-muted-foreground">
														View source code & contribute
													</span>
												</div>
											</div>
											<ExternalLink className="w-4 h-4 text-muted-foreground" />
										</Button>
									</Link>
								</div>
							</div>
						</Card>

						<Card className="p-6">
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<Star className="w-5 h-5 text-[#FFB211]" />
									<h2 className="font-semibold">Community</h2>
								</div>
								<div className="grid gap-2">
									<Link href="https://github.com/withzu/mongonaut" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-between h-auto py-3 px-4 hover:bg-accent"
										>
											<div className="flex items-center gap-3">
												<Star className="w-4 h-4 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">Star on GitHub</span>
													<span className="text-xs text-muted-foreground">Show your support</span>
												</div>
											</div>
											<ExternalLink className="w-4 h-4 text-muted-foreground" />
										</Button>
									</Link>
									<Link href="https://github.com/withzu/mongonaut/issues" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-between h-auto py-3 px-4 hover:bg-accent"
										>
											<div className="flex items-center gap-3">
												<Code className="w-4 h-4 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">Report Issues</span>
													<span className="text-xs text-muted-foreground">Help us improve</span>
												</div>
											</div>
											<ExternalLink className="w-4 h-4 text-muted-foreground" />
										</Button>
									</Link>
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
