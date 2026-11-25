import Image from 'next/image';
import { cn } from '@/lib/utils';

export function LogoMark({ className, priority }: { className?: string; priority?: boolean }) {
	return (
		<Image
			src="/images/logo-mark.svg"
			alt=""
			aria-hidden="true"
			width={380}
			height={738}
			priority={priority}
			className={cn('h-5 w-auto dark:invert', className)}
		/>
	);
}
