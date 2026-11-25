interface ShortcutDefinition {
	keys: string[];
	label: string;
	group: 'General' | 'Collection' | 'Document' | 'Editor' | 'Sidebar';
	inDialogs?: boolean;
	repeat?: boolean;
	write?: boolean;
}

const definitions = {
	'quick-open': {
		keys: ['mod+k'],
		label: 'Go to a collection or action',
		group: 'General',
		inDialogs: true,
	},
	'search': { keys: ['/'], label: 'Search the sidebar', group: 'General' },
	'toggle-sidebar': { keys: ['mod+b'], label: 'Show or hide the sidebar', group: 'General' },
	'toggle-theme': { keys: ['t'], label: 'Switch between light and dark', group: 'General' },
	'refresh': { keys: ['r'], label: 'Reload the data', group: 'General' },
	'create': {
		keys: ['shift+n'],
		label: 'Create a database or collection',
		group: 'General',
		write: true,
	},
	'help': { keys: ['?'], label: 'Show keyboard shortcuts', group: 'General' },

	'focus-query': { keys: ['f'], label: 'Edit the query', group: 'Collection' },
	'run-query': { keys: ['mod+enter'], label: 'Run the query', group: 'Collection' },
	'add-documents': { keys: ['n'], label: 'Add documents', group: 'Collection', write: true },
	'next-page': { keys: ['shift+j'], label: 'Next page', group: 'Collection' },
	'previous-page': { keys: ['shift+k'], label: 'Previous page', group: 'Collection' },

	'next-document': { keys: ['j'], label: 'Next document', group: 'Document', repeat: true },
	'previous-document': { keys: ['k'], label: 'Previous document', group: 'Document', repeat: true },
	'copy-document': { keys: ['c'], label: 'Copy as JSON', group: 'Document' },
	'edit-document': { keys: ['e'], label: 'Edit', group: 'Document', write: true },
	'delete-document': {
		keys: ['delete', 'backspace'],
		label: 'Delete, after confirmation',
		group: 'Document',
		write: true,
	},

	'save': {
		keys: ['mod+s', 'mod+enter'],
		label: 'Save the document',
		group: 'Editor',
		inDialogs: true,
		write: true,
	},

	'tree-move': {
		keys: ['arrowdown', 'arrowup'],
		label: 'Move through the tree',
		group: 'Sidebar',
	},
	'tree-open': {
		keys: ['arrowright', 'arrowleft'],
		label: 'Open or close a database',
		group: 'Sidebar',
	},
} satisfies Record<string, ShortcutDefinition>;

export type ShortcutId = keyof typeof definitions;

export const SHORTCUTS: Record<ShortcutId, ShortcutDefinition> = definitions;

export type ShortcutHandler = () => void | boolean;

const handlers = new Map<ShortcutId, ShortcutHandler[]>();

export function isMac(): boolean {
	return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
}

function pressedKey(event: KeyboardEvent): string {
	const key = event.key.toLowerCase();
	if (key.length === 1 && key > '\x7f' && /^Key[A-Z]$/.test(event.code)) {
		return event.code.slice(3).toLowerCase();
	}
	return key;
}

function matchesCombo(combo: string, event: KeyboardEvent): boolean {
	const parts = combo.split('+');
	const key = parts[parts.length - 1];
	const primary = isMac() ? event.metaKey : event.ctrlKey;
	const secondary = isMac() ? event.ctrlKey : event.metaKey;

	if (event.altKey || secondary || primary !== parts.includes('mod')) return false;
	if (pressedKey(event) !== key) return false;
	const isSymbol = key.length === 1 && !/[a-z]/.test(key);
	return isSymbol || event.shiftKey === parts.includes('shift');
}

function isTypingTarget(target: EventTarget | null): boolean {
	return (
		target instanceof Element &&
		target.closest(
			'input, textarea, select, [contenteditable="true"], [role="textbox"], [role="combobox"]',
		) !== null
	);
}

function isOverlayOpen(): boolean {
	return (
		document.querySelector(
			['dialog', 'alertdialog', 'menu', 'listbox']
				.map(role => `[role="${role}"][data-state="open"]`)
				.join(','),
		) !== null
	);
}

function runHandlers(id: ShortcutId): boolean {
	const stack = handlers.get(id) ?? [];
	for (let index = stack.length - 1; index >= 0; index -= 1) {
		if (stack[index]() !== false) return true;
	}
	return false;
}

export function runShortcut(id: ShortcutId): void {
	runHandlers(id);
}

function handleKeyDown(event: KeyboardEvent): void {
	if (event.defaultPrevented || event.isComposing) return;

	for (const id of handlers.keys()) {
		const definition = SHORTCUTS[id];
		const combo = definition.keys.find(candidate => matchesCombo(candidate, event));
		if (!combo) continue;
		if (!definition.inDialogs && isOverlayOpen()) continue;
		if (!combo.includes('mod') && (isTypingTarget(event.target) || !singleKeysEnabled())) continue;

		if ((event.repeat && !definition.repeat) || runHandlers(id)) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
	}
}

export function registerShortcut(id: ShortcutId, handler: ShortcutHandler): () => void {
	if (handlers.size === 0) window.addEventListener('keydown', handleKeyDown, { capture: true });
	handlers.set(id, [...(handlers.get(id) ?? []), handler]);

	return () => {
		const rest = (handlers.get(id) ?? []).filter(entry => entry !== handler);
		if (rest.length > 0) handlers.set(id, rest);
		else handlers.delete(id);
		if (handlers.size === 0) {
			window.removeEventListener('keydown', handleKeyDown, { capture: true });
		}
	};
}

const SINGLE_KEYS_STORAGE = 'singleKeyShortcuts';
const listeners = new Set<() => void>();
let singleKeys: boolean | undefined;

export function singleKeysEnabled(): boolean {
	if (singleKeys === undefined) {
		try {
			singleKeys = localStorage.getItem(SINGLE_KEYS_STORAGE) !== 'off';
		} catch {
			singleKeys = true;
		}
	}
	return singleKeys;
}

export function setSingleKeysEnabled(enabled: boolean): void {
	singleKeys = enabled;
	try {
		localStorage.setItem(SINGLE_KEYS_STORAGE, enabled ? 'on' : 'off');
	} catch {}
	listeners.forEach(listener => listener());
}

export function subscribeSingleKeys(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

const MAC_SYMBOLS: Record<string, string> = {
	mod: '⌘',
	shift: '⇧',
	enter: '↵',
	delete: '⌦',
	backspace: '⌫',
};

const NAMES: Record<string, string> = {
	mod: 'Ctrl',
	shift: 'Shift',
	enter: 'Enter',
	delete: 'Del',
	backspace: 'Backspace',
};

const ARROWS: Record<string, string> = {
	arrowup: '↑',
	arrowdown: '↓',
	arrowleft: '←',
	arrowright: '→',
};

export function formatCombo(combo: string, mac: boolean): string {
	const symbols = mac ? MAC_SYMBOLS : NAMES;
	const parts = combo.split('+').map(part => ARROWS[part] ?? symbols[part] ?? part.toUpperCase());
	return parts.join(mac ? '' : ' ');
}
