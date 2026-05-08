import { Skeleton } from '@/components/ui/skeleton';
import { AppContainer } from '@/components/custom/app-container';

export default function Loading() {
	return (
		<AppContainer>
			<div className="flex items-center gap-2">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-32" />
			</div>

			<div className="w-full h-full flex flex-col gap-4">
				<div className="w-full flex items-center gap-6 px-4 py-3 bg-muted/30 rounded-lg">
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-8" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-12" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="h-4 w-4" />
						<Skeleton className="h-4 w-16" />
						<Skeleton className="h-4 w-12" />
					</div>
				</div>

				<Skeleton className="w-full h-10 rounded-lg" />

				<div className="space-y-4">
					<Skeleton className="w-full h-48 rounded-lg" />
					<Skeleton className="w-full h-48 rounded-lg" />
					<Skeleton className="w-full h-48 rounded-lg" />
				</div>

				<div className="flex items-center justify-between">
					<Skeleton className="h-8 w-24" />
					<div className="flex gap-2">
						<Skeleton className="h-8 w-8" />
						<Skeleton className="h-8 w-8" />
						<Skeleton className="h-8 w-8" />
					</div>
					<Skeleton className="h-8 w-24" />
				</div>
			</div>
		</AppContainer>
	);
}
