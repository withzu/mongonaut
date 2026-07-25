'use client';

import dynamic from 'next/dynamic';
import type { JsonEditorCoreProps } from '@/components/custom/json-editor-core';

const importCore = () => import('@/components/custom/json-editor-core');

const JsonEditorCore = dynamic(importCore, {
	ssr: false,
	loading: () => <div className="bg-muted/40 h-full w-full animate-pulse" />,
});

export function preloadJsonEditor(): void {
	void importCore();
}

export function LazyJsonEditor({ height, ...props }: JsonEditorCoreProps) {
	return (
		<div style={{ height }} className="w-full">
			<JsonEditorCore height={height} {...props} />
		</div>
	);
}
