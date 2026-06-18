import React from 'react';

export function AppContainer({ children }: { children?: React.ReactNode | React.ReactNode[] }) {
	return (
		<div className="mt-28 flex h-full w-full flex-col gap-4 p-2 md:mt-0 md:p-6">{children}</div>
	);
}
