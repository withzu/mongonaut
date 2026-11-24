'use client';

import { useTheme } from 'next-themes';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className="toaster group"
			toastOptions={{
				classNames: {
					success: '[&_[data-icon]]:text-inverse-success',
					error: '[&_[data-icon]]:text-inverse-danger',
				},
			}}
			style={
				{
					'--normal-bg': 'var(--mgn-surface-inverse)',
					'--normal-text': 'var(--mgn-on-inverse)',
					'--normal-border': 'var(--mgn-surface-inverse)',
					'--border-radius': 'var(--radius-lg)',
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
