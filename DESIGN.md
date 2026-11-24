---
name: Mongonaut
description: A quiet tool window for MongoDB. Gray chrome around a bright content surface, one magenta accent, and state carried by fill.
colors:
  surface-content: '#ffffff'
  surface-chrome: '#f7f8fa'
  surface-inverse: '#27282e'
  separator: '#ebecf0'
  control-border: '#c9ccd6'
  text: '#000000'
  text-secondary: '#6c707e'
  text-disabled: '#a8adbd'
  text-link: '#b01bcc'
  state-hover: '#ebecf0'
  state-pressed: '#dfe1e5'
  selection: '#f4d6f9'
  brand-fill: '#c725e5'
  brand-fill-hover: '#b01bcc'
  brand-fill-pressed: '#9716b0'
  brand-mark: '#c725e5'
  brand-soft: '#faeefc'
  danger: '#cc3645'
  success: '#1f7536'
typography:
  title:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 600
    lineHeight: '1.5rem'
  heading:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: '1.25rem'
  default:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: '1rem'
  paragraph:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: '1.125rem'
  small:
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: '1rem'
  code:
    fontFamily: 'JetBrains Mono, ui-monospace, monospace'
    fontSize: '0.8125rem'
    fontWeight: 400
    lineHeight: '1.375rem'
rounded:
  sm: '3px'
  md: '4px'
  lg: '8px'
spacing:
  inside: '0.375rem'
  related: '0.5rem'
  row: '0.75rem'
  group: '1.25rem'
components:
  button-primary:
    backgroundColor: '{colors.brand-fill}'
    textColor: '#ffffff'
    rounded: '{rounded.md}'
    padding: '0 0.75rem'
    height: '1.75rem'
  button-outline:
    backgroundColor: '{colors.surface-content}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '0 0.75rem'
    height: '1.75rem'
  input:
    backgroundColor: '{colors.surface-content}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '0 0.5rem'
    height: '1.75rem'
  tree-row-active:
    backgroundColor: '{colors.selection}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    height: '1.5rem'
  popup:
    backgroundColor: '{colors.surface-content}'
    rounded: '{rounded.lg}'
    padding: '0.375rem'
  dialog:
    backgroundColor: '{colors.surface-chrome}'
    rounded: '{rounded.lg}'
    padding: '1.25rem'
---

# Design System: Mongonaut

## Overview

Mongonaut looks like a tool window: quiet gray chrome around a content surface where the documents live. Regions meet at 1px separators, controls are small and exact, and color appears only when it carries a state or marks the one default action.

The system is abstracted from an IDE interface kit. It takes over the kit's roles, proportions and rules. It does not take over its blue accent, its icons or any product marks. Magenta is Mongonaut's accent.

## Architecture

Two tiers, both in `src/app/tokens.css`:

1. **Ramps** (`--mgn-neutral-*`, `--mgn-brand-*`, `--mgn-danger-*`, `--mgn-success-*`, `--mgn-warning-*`) are raw color steps.
2. **Roles** (`--mgn-surface-chrome`, `--mgn-selection`, `--mgn-control-border`) say what a color is for.

`src/app/globals.css` exposes roles as utilities. Names the component base already uses (`bg-background`, `text-muted-foreground`) point at roles, and new names (`bg-chrome`, `bg-selection`, `border-control-border`) fill the gaps.

**The Role Rule.** Only `tokens.css` may reference a ramp or write a color value. Components use utilities, and third party editors receive `var(--mgn-role)`.

**The Swap Rule.** Changing the accent means replacing the `--mgn-brand-*` ramp and `--mgn-on-brand` in both themes. If a component has to change too, a role is missing.

## Colors

### Surfaces

| Role | Light | Dark | For |
| --- | --- | --- | --- |
| `surface-content` | `#ffffff` | `#1e1f22` | Documents, editors, page ground |
| `surface-chrome` | `#f7f8fa` | `#2b2d30` | Sidebar, toolbars, panels, dialogs |
| `surface-popup` | `#ffffff` | `#2b2d30` | Menus, selects, popovers |
| `surface-inverse` | `#27282e` | `#393b40` | Tooltips, notifications |

**The Content Extreme Rule.** Content is the lightest surface in the light theme and the darkest in the dark theme. Chrome always sits between content and ink.

### States

| Role | Light | Dark |
| --- | --- | --- |
| `state-hover` | `#ebecf0` | `#393b40` |
| `state-pressed` | `#dfe1e5` | `#4e5157` |
| `selection` | `#f4d6f9` | `#55305f` |
| `focus` | `#c725e5` | `#dd7bf0` |

**The Three Fills Rule.** Hover and pressed are neutral, selection is accent tinted. They are never interchangeable: hover must not look selected.

**The Steady Text Rule.** Selection changes the fill only. Label color and weight stay as they are, secondary text moves to `selection-secondary` to keep its contrast, on hovered rows as well.

### Accent

- `brand-fill` (`#c725e5`, both themes) sits behind white text. Hover and pressed go one and two steps darker in both themes.
- `brand-mark` is the accent drawn as a line or icon, such as the tab underline. `#c725e5` light, `#dd7bf0` dark.
- `text-link` is the accent as text. `#b01bcc` light, `#e59bf4` dark.
- `brand-soft` is a quiet tint for chips and the attribution panel.

**The Accent Step Rule.** `#c725e5` is a fill in both themes and a line on light surfaces. Text and everything on dark surfaces uses the neighboring steps, which keep their contrast.

### Status

Danger, success and warning each have a ramp of their own, independent of the accent, with a text color, a soft fill and a line. Status is always paired with an icon or a word. A switched on toggle is green, because it reports a state and is not an action.

### Contrast

Text meets 4.5:1, and focus lines, status marks, gutter numbers and toggle tracks meet 3:1, on the surfaces they are used on. Where the source kit falls short, the role takes a neighboring step of the same ramp: secondary text, links, focus, the toggle track, the code selection and the destructive fill were all moved this way.

Three exceptions are on purpose. White on `brand-fill` reaches 4.35:1, because the accent is fixed, its hover and pressed steps are above 4.5:1. Disabled text is exempt. Resting field borders stay quiet, between 1.5:1 and 2.1:1, and rely on the label, the fill and the 2px focus line.

**The Danger Ground Rule.** Danger text sits on content, chrome or `danger-soft`, never on the hover or selection fill. Destructive actions hover with `danger-soft`.

## Typography

Inter for the interface, JetBrains Mono for code and data.

| Style | Size / line | Utility |
| --- | --- | --- |
| Title | 20 / 24 semibold | `text-xl font-semibold` |
| Heading | 16 / 20 semibold | `text-base font-semibold` |
| Default | 13 / 16 | `text-sm` |
| Paragraph | 13 / 18 | `text-sm leading-paragraph` |
| Small | 12 / 16 | `text-xs` |
| Code | 13 / 22 | `font-mono leading-code` |

**The Two Weights Rule.** Regular and semibold. No medium, no bold.

**The Default Size Rule.** 13px is the working size, 12px the minimum. Inputs use 16px below 768px so phones do not zoom.

**The Tabular Rule.** Numbers a user may compare use tabular figures.

**The Sentence Case Rule.** No uppercase styling and no letter spacing.

## Shape

| Radius | For |
| --- | --- |
| 3px (`rounded-sm`) | Toolbar button states, toggles |
| 4px (`rounded-md`) | Controls, rows, chips, tooltips |
| 8px (`rounded-lg`) | Popups, dialogs, notifications, inset panels and banners |
| 0 | Regions that touch a window edge |

There are no pills. The only circle is the update dot.

## Elevation

Shadows belong to surfaces that left the page: `shadow-sm` for tooltips, `shadow-md` for popups, `shadow-lg` for dialogs. In the page, depth is a separator plus a surface change. No blur and no gradients.

## Spacing

| Distance | For |
| --- | --- |
| 6px | Icon to label, label to its field |
| 8px | Related controls, unrelated settings in one group |
| 12px | Form rows, dialog buttons, panel padding |
| 16px | Settings on one line |
| 20px | Groups, page and dialog insets |

Control heights come from variables, with a larger ladder below 768px for touch:

| Variable | Desktop | Touch |
| --- | --- | --- |
| `--mgn-height-control` | 28px | 36px |
| `--mgn-height-control-slim` | 24px | 32px |
| `--mgn-height-toolbar` | 26px | 36px |
| `--mgn-height-row` | 24px | 36px |
| `--mgn-height-header` | 40px | 48px |

**The Single Breakpoint Rule.** 768px is the only breakpoint, defined in `useIsMobile` and mirrored by `md:`.

## Components

- **Buttons.** `default` is the accent, `outline` is secondary, `ghost` is a toolbar action, `destructive` confirms a loss. **The One Default Rule:** at most one accent button per region. Dialogs put Cancel first and the default action last.
- **Disabled.** A gray fill with gray text. Never reduced opacity.
- **Focus.** One 2px line in `focus`. Use `focus-fill` on filled controls (1px gap), `focus-field` on bordered controls (replaces the border), `focus-row` inside rows and tabs.
- **Fields.** `aria-invalid` drives the error line. There is no separate error class.
- **Tabs.** A 3px underline on the selected tab, plain text otherwise. The strip is as tall as a header.
- **Segmented control.** A bordered strip with a bordered selected segment. Used by the theme switch.
- **Tree.** 24px rows, 16px chevron and icon slots, children aligned under their parent's label. The sidebar has two columns, icons at 16px and text at 38px, shared by logo, search and tree. No guide lines and no gap between rows. The open collection carries the selection fill at half strength, because it stays on screen all the time.
- **Popups.** 6px inset on all sides, 24px rows with a 4px selection. Separators keep the inset.
- **Page header.** No strip above the content. The first row starts 8px from the top and lines up with the logo row of the sidebar.
- **Shortcuts.** Defined once in `src/lib/shortcuts.ts`, shown as 20px chips with a 4px radius, hidden on touch. Combinations work everywhere, single keys only outside of fields and only while they are turned on. No shortcut writes data without a second step.
- **Quick switcher.** A popup surface 12% from the top, opened with `mod+K`. Selection follows the keyboard and the pointer.
- **Dialogs.** Chrome surface, 20px inset, 16px heading, paragraph description, buttons 12px apart on the right.
- **Banner.** The inline message: 8px radius, 12px padding, soft fill, matching line, status icon, ordinary text color.
- **Badge.** A 20px chip with a 4px radius. Read-only uses the accent tint.
- **Notifications.** Inverse surface with a status colored icon.
- **Panels.** Query panel, stats and document headers sit on chrome, document bodies on content, inside one 8px frame.
- **Code.** Editors and the document tree share the `--mgn-code-*` roles and follow the theme through CSS variables.

## Don'ts

- Don't write a color value or a ramp variable outside `tokens.css`.
- Don't use `brand-fill` as a text color or as a line on a dark surface.
- Don't put two accent buttons in one region.
- Don't add a shadow to anything that scrolls with the page.
- Don't signal selection with bold text, or hover with the selection fill.
- Don't hardcode a control height. Use the height variables.
- Don't animate layout. Only color changes and the sidebar's width and position. Menus, selects and popovers open and close without animation.
- Don't add a second accent. `--mgn-series-*` is for data visualization only.
