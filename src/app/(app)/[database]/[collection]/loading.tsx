import { Skeleton } from '@/components/ui/skeleton';
import { AppContainer } from '@/components/custom/app-container';

export default function Loading() {
	return (
		<AppContainer>
			<div className="hidden min-h-(--mgn-height-control-slim) items-center gap-2 md:flex">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-4 w-4" />
				<Skeleton className="h-4 w-32" />
			</div>

			<div className="flex h-full w-full flex-col gap-3">
				<div className="bg-chrome flex w-full items-center gap-4 rounded-lg border px-3 py-2">
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

				<Skeleton className="h-32 w-full rounded-lg" />

				<div className="space-y-3">
					<Skeleton className="w-full h-48 rounded-lg" />
					<Skeleton className="w-full h-48 rounded-lg" />
					<Skeleton className="w-full h-48 rounded-lg" />
				</div>

				<div className="flex items-center justify-between">
					<Skeleton className="h-(--mgn-height-control) w-24" />
					<div className="flex gap-2">
						<Skeleton className="size-(--mgn-height-control)" />
						<Skeleton className="size-(--mgn-height-control)" />
						<Skeleton className="size-(--mgn-height-control)" />
					</div>
					<Skeleton className="h-(--mgn-height-control) w-24" />
				</div>
			</div>
		</AppContainer>
	);
}
