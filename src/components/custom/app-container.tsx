import React from 'react';

export function AppContainer({ children }: { children?: React.ReactNode | React.ReactNode[] }) {
	return (
		<div className="mt-28 flex h-full w-full flex-col gap-3 p-2 md:mt-0 md:p-5 md:pt-2">
			{children}
		</div>
	);
}

export function CenteredContainer({ children }: { children?: React.ReactNode }) {
	return (
		<div className="flex min-h-svh w-full flex-col items-center justify-center px-4 pt-32 pb-8 md:py-8">
			{children}
		</div>
	);
}
