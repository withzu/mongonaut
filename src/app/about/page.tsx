import { Github, Users, BookOpen, Code, Star } from 'lucide-react';
import Link from 'next/link';
import { AppContainer } from '@/components/custom/app-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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
						<Button variant="outline" className="gap-2">
							<img src="/images/github-mark.svg" alt="GitHub" className="w-4 h-4 dark:invert" />
							View on GitHub
						</Button>
					</div>

					<div className="bg-linear-to-br w-full from-purple-500/5 via-background to-blue-500/5 rounded-lg border p-6">
						<div className="grid gap-6 w-full">
							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<Users className="w-5 h-5 text-purple-500" />
									<h2 className="font-semibold">Contributors</h2>
								</div>
								<div className="flex flex-wrap gap-2">
									<a href="https://github.com/toohard2explain" target="_blank">
										<div className="flex items-center gap-2 bg-background/50 backdrop-blur-xs px-3 py-1.5 rounded-full border border-border/50">
											<img
												src="https://avatars.githubusercontent.com/u/78054244?v=4"
												className="w-6 h-6 rounded-full"
												alt=""
											/>
											<span className="text-sm">Levi H</span>
										</div>
									</a>
									<a href="https://github.com/maaaathis" target="_blank">
										<div className="flex items-center gap-2 bg-background/50 backdrop-blur-xs px-3 py-1.5 rounded-full border border-border/50">
											<img
												src="https://avatars.githubusercontent.com/u/37186532?v=4"
												className="w-6 h-6 rounded-full"
												alt=""
											/>
											<span className="text-sm">maaaathis</span>
										</div>
									</a>
								</div>
							</div>

							<Separator />

							<div className="space-y-4">
								<div className="flex items-center gap-2">
									<Code className="w-5 h-5 text-blue-500" />
									<h2 className="font-semibold">Quick Access</h2>
								</div>
								<div className="grid gap-2">
									<Link href="https://github.com/withzu/mongonaut" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-start h-auto py-3 px-4 hover:bg-background/80"
										>
											<div className="flex items-center gap-3">
												<Github className="w-5 h-5 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">Repository</span>
													<span className="text-xs text-muted-foreground">
														github.com/withzu/mongonaut
													</span>
												</div>
											</div>
										</Button>
									</Link>
									<Link href="https://mongonaut.org/docs" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-start h-auto py-3 px-4 hover:bg-background/80"
										>
											<div className="flex items-center gap-3">
												<BookOpen className="w-5 h-5 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">Documentation</span>
													<span className="text-xs text-muted-foreground">
														Learn how to use Mongonaut
													</span>
												</div>
											</div>
										</Button>
									</Link>
									<Link href="https://github.com/withzu/mongonaut" target="_blank">
										<Button
											variant="ghost"
											className="w-full justify-start h-auto py-3 px-4 hover:bg-background/80"
										>
											<div className="flex items-center gap-3">
												<Star className="w-5 h-5 text-muted-foreground" />
												<div className="flex flex-col items-start">
													<span className="text-sm font-medium">Star the Project</span>
													<span className="text-xs text-muted-foreground">Show your support</span>
												</div>
											</div>
										</Button>
									</Link>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppContainer>
	);
}
