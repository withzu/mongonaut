'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { formatCount } from '@/lib/utils';

const PAGE_SIZES = [10, 20, 50, 100, 200];

interface PaginationControlsProps {
	currentPage: number;
	pageSize: number;
	total: number | null;
	totalPages: number | null;
	hasMore: boolean;
	shownCount: number;
	query?: Record<string, string | undefined>;
}

export function PaginationControls({
	currentPage,
	pageSize,
	total,
	totalPages,
	hasMore,
	shownCount,
	query,
}: PaginationControlsProps) {
	const router = useRouter();
	const pathname = usePathname();

	const push = (changes: Record<string, string | undefined>) => {
		const urlParams = new URLSearchParams();
		if (query) {
			Object.entries(query).forEach(([key, value]) => {
				if (value) urlParams.set(key, value);
			});
		}
		for (const [key, value] of Object.entries(changes)) {
			if (value === undefined) urlParams.delete(key);
			else urlParams.set(key, value);
		}
		const qs = urlParams.toString();
		router.push(qs ? `${pathname}?${qs}` : pathname);
	};

	const from = shownCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
	const to = shownCount === 0 ? 0 : from + shownCount - 1;

	return (
		<nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 mt-4">
			<div className="text-sm text-muted-foreground" aria-live="polite">
				{shownCount === 0
					? 'No documents'
					: total === null
						? `Showing ${from} to ${to} (page ${currentPage})`
						: `Showing ${from} to ${to} of ${formatCount(total)}${
								totalPages ? ` (page ${currentPage} of ${totalPages})` : ''
							}`}
			</div>

			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2">
					<label htmlFor="pageSize" className="text-sm text-muted-foreground">
						Per page
					</label>
					<Select
						value={String(pageSize)}
						onValueChange={value => push({ pageSize: value, page: '1' })}
					>
						<SelectTrigger id="pageSize" className="w-20" aria-label="Documents per page">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZES.map(size => (
								<SelectItem key={size} value={String(size)}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						disabled={currentPage <= 1}
						onClick={() => push({ page: String(currentPage - 1) })}
					>
						Previous
					</Button>

					<Button
						variant="outline"
						disabled={!hasMore}
						onClick={() => push({ page: String(currentPage + 1) })}
					>
						Next
					</Button>
				</div>
			</div>
		</nav>
	);
}
