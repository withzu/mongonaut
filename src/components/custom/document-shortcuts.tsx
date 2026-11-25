'use client';

import { useShortcut } from '@/hooks/use-shortcut';

function isBelowTop(element: HTMLElement): boolean {
	return element.getBoundingClientRect().bottom > 80;
}

function moveFocus(step: 1 | -1): boolean {
	const documents = [...document.querySelectorAll<HTMLElement>('[data-document]')];
	if (documents.length === 0) return false;

	const current = documents.findIndex(element => element.contains(document.activeElement));
	const target =
		current === -1
			? (documents.find(isBelowTop) ?? documents[documents.length - 1])
			: documents[current + step];
	if (!target) return true;

	target.focus({ preventScroll: true });
	target.scrollIntoView({ block: 'nearest' });
	return true;
}

export function DocumentShortcuts() {
	useShortcut('next-document', () => moveFocus(1));
	useShortcut('previous-document', () => moveFocus(-1));
	return null;
}
