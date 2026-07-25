---
name: Mongonaut
description: A warm-paper terminal for MongoDB, where hairlines carry structure and amber is the only voice that raises itself.
colors:
  warm-paper: 'hsl(40 30% 98%)'
  card-paper: 'hsl(44 36% 99%)'
  sidebar-paper: 'hsl(42 28% 96%)'
  wash: 'hsl(40 22% 93%)'
  accent-wash: 'hsl(40 30% 90%)'
  ink: 'hsl(28 14% 16%)'
  ink-solid: 'hsl(28 16% 19%)'
  ink-accent: 'hsl(28 16% 22%)'
  pencil: 'hsl(32 8% 44%)'
  rule-line: 'hsl(38 18% 87%)'
  zu-amber: '#FFB211'
  zu-amber-pressed: '#E5A010'
  signal-amber: 'hsl(30 90% 40%)'
  focus-amber: 'hsl(35 92% 40%)'
  marker-wash: 'hsl(38 50% 90%)'
  marker-ink: 'hsl(28 92% 30%)'
  alarm: 'hsl(4 76% 45%)'
typography:
  display:
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 600
    lineHeight: '2rem'
    letterSpacing: '-0.025em'
    fontFeature: "'cv11', 'ss01'"
  headline:
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 600
    lineHeight: '1.75rem'
  title:
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
    fontSize: '1rem'
    fontWeight: 600
    lineHeight: '1'
  body:
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: '1.25rem'
  label:
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 500
    lineHeight: '1rem'
  metric:
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 400
    lineHeight: '1rem'
    fontFeature: "'tnum'"
  code:
    fontFamily: 'var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: '1rem'
rounded:
  sm: '6px'
  md: '8px'
  lg: '10px'
  xl: '14px'
  full: '9999px'
spacing:
  hairline-inset: '0.25rem'
  tight: '0.5rem'
  control: '0.75rem'
  block: '1rem'
  page: '1.5rem'
components:
  button-primary:
    backgroundColor: '{colors.ink-solid}'
    textColor: '{colors.warm-paper}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
    height: '2.25rem'
    typography: '{typography.body}'
  button-primary-hover:
    backgroundColor: 'hsl(28 16% 19% / 0.9)'
  button-identity:
    backgroundColor: '{colors.zu-amber}'
    textColor: '#000000'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
    height: '2.25rem'
    typography: '{typography.body}'
  button-identity-hover:
    backgroundColor: '{colors.zu-amber-pressed}'
    textColor: '#000000'
  button-outline:
    backgroundColor: '{colors.warm-paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '0.5rem 1rem'
    height: '2.25rem'
  button-ghost-hover:
    backgroundColor: '{colors.accent-wash}'
    textColor: '{colors.ink-accent}'
    rounded: '{rounded.md}'
  button-destructive:
    backgroundColor: '{colors.alarm}'
    textColor: '#FFFFFF'
    rounded: '{rounded.md}'
    height: '2.25rem'
  button-link:
    textColor: '{colors.signal-amber}'
  input:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '0.25rem 0.75rem'
    height: '2.25rem'
    typography: '{typography.body}'
  card:
    backgroundColor: '{colors.card-paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.xl}'
    padding: '1.5rem 0'
  panel:
    backgroundColor: 'hsl(40 22% 93% / 0.2)'
    textColor: '{colors.ink}'
    rounded: '{rounded.lg}'
  panel-header:
    backgroundColor: 'transparent'
    textColor: '{colors.pencil}'
    padding: '0.5rem 0.75rem'
  badge-outline:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '0.125rem 0.5rem'
    typography: '{typography.label}'
  badge-state:
    backgroundColor: '{colors.ink-solid}'
    textColor: '{colors.warm-paper}'
    rounded: '{rounded.full}'
    padding: '0.125rem 0.625rem'
    typography: '{typography.label}'
  nav-row:
    backgroundColor: 'transparent'
    textColor: 'hsl(30 10% 32%)'
    rounded: '{rounded.md}'
    padding: '0.5rem'
    height: '2rem'
    typography: '{typography.body}'
  nav-row-active:
    backgroundColor: '{colors.marker-wash}'
    textColor: '{colors.marker-ink}'
    rounded: '{rounded.md}'
  tabs-list:
    backgroundColor: '{colors.wash}'
    textColor: '{colors.pencil}'
    rounded: '{rounded.lg}'
    padding: '3px'
    height: '2.25rem'
  tabs-trigger-active:
    backgroundColor: '{colors.warm-paper}'
    textColor: '{colors.ink}'
    rounded: '{rounded.md}'
    padding: '0.25rem 0.5rem'
---

# Design System: Mongonaut

## Overview

**Creative North Star: "The Warm Terminal"**

Mongonaut has the density and precision of a developer tool, rendered on paper instead of on a black console. Everything a terminal earns through monospace, alignment and restraint is here, but the ground is a warm off-white (`#fbfaf8`) rather than a void, and the ink is a soft brown-black (`#2f2823`) rather than pure black. The result reads as an instrument you can sit in front of all day: warm enough not to fatigue, quiet enough that a document's contents are always the loudest thing on screen.

The system is structurally flat. Hairline borders at `#e4dfd8` do the work that shadows and cards do elsewhere, and the three surface tones (sidebar, page, card) form a shallow tonal ladder where coming forward means getting lighter, in both themes. Numbers are treated as a first-class material: every count, byte size and version renders in tabular figures so that columns of them line up down the sidebar. Controls are quiet and precise. Ghost and outline variants do most of the work, fixed control heights (`2.25rem` default, `2rem` compact, `1.75rem` in-panel) hold the grid, and solid fills are rare enough to mean something.

Amber is the only chromatic voice in the product. It arrives in exactly two registers: the Zu identity amber `#FFB211` as a fill behind black text on the doors into the app, and a darkened Signal Amber for accent text, active navigation and focus. Nothing else in the interface is allowed to be colorful. What Mongonaut deliberately is not: the grey Bootstrap chrome and bordered data tables of the mongo-express era, and the glassmorphic purple-and-cyan register of contemporary AI tooling. No gradients inside the product, no glow, no neon.

**Key Characteristics:**

- Warm paper ground and brown-black ink; never pure white, never pure black
- Hairline borders as the primary structural device; shadows reserved for detached surfaces
- Amber as the single accent, in two strictly separated roles
- Tabular figures on every comparable number
- `0.875rem` as the working body size; `text-base` and up reserved for titles
- Fixed control-height ladder; no free-form vertical sizing
- One breakpoint at 768px, dark mode as a peer of light

## Colors

A warm neutral field of five paper and ink tones, interrupted only by amber, with a single red reserved for destruction.

### Primary

- **Zu Amber** (`#FFB211`): The Zu Company identity amber. Legal only as a solid fill behind black text, on the surfaces that are doors into the product: the sign-in submit, the single sign-on launch, the first-run setup submit, and the Zu attribution CTA on About. Pressed state darkens to Zu Amber Pressed (`#E5A010`).
- **Signal Amber** (`hsl(30 90% 40%)` / `#c2660a` light, `hsl(38 92% 60%)` / `#f7b23b` dark): The applied amber, exposed as `--brand`. Carries amber that has to be legible as a mark rather than as a field: link-variant buttons, the accent icon on About, and anything that needs the identity in text weight. In dark mode this is effectively the identity amber itself; in light mode it is the identity amber darkened until it can be read.
- **Marker Ink** (`hsl(28 92% 30%)` light, `hsl(40 95% 64%)` dark) on **Marker Wash** (`hsl(38 50% 90%)` light, `hsl(34 24% 18%)` dark): The active collection in the sidebar tree. This pairing is the one place amber becomes a filled region inside the working interface, and it exists to answer one question at a glance: which collection am I in.
- **Focus Amber** (`hsl(35 92% 40%)` light, `hsl(38 90% 56%)` dark): Exposed as `--ring`. Focus indicators only, always as a `3px` ring at 50% alpha with a matching solid border on the focused edge.

### Neutral

- **Warm Paper** (`hsl(40 30% 98%)` / `#fbfaf8` light, `hsl(30 8% 10%)` / `#1c1a17` dark): The page ground and the default working surface.
- **Card Paper** (`hsl(44 36% 99%)` / `#fdfdfc` light, `hsl(30 7% 13%)` / `#23211f` dark): Raised surfaces. One step lighter than the page in both themes.
- **Sidebar Paper** (`hsl(42 28% 96%)` / `#f8f6f2` light, `hsl(28 9% 9%)` / `#191715` dark): The navigation ground. One step darker than the page in both themes, so the tree recedes behind the data.
- **Ink** (`hsl(28 14% 16%)` / `#2f2823` light, `hsl(40 22% 91%)` / `#edeae3` dark): Body and heading text. 13.9:1 on the light ground, 14.5:1 on the dark.
- **Ink Solid** (`hsl(28 16% 19%)` / `#383029` light, `hsl(40 28% 91%)` dark): The solid-fill neutral, exposed as `--primary`. Default buttons, the read-only pill.
- **Pencil** (`hsl(32 8% 44%)` / `#797167` light, `hsl(36 11% 62%)` / `#a9a093` dark): Secondary text, field labels, inline icons, metadata. 4.6:1 light and 6.7:1 dark, so it stays a legible second voice rather than a decorative grey.
- **Rule Line** (`hsl(38 18% 87%)` / `#e4dfd8` light, `hsl(30 6% 20%)` / `#363330` dark): Every border and every input stroke. Applied globally, so a bare `border` class is already correct.
- **Wash** (`hsl(40 22% 93%)` / `#f1eee9` light, `hsl(30 6% 16%)` dark): Secondary button fills, tab strips, muted regions. Also appears at 20% and 30% alpha as the tint inside framed panels.
- **Accent Wash** (`hsl(40 30% 90%)` / `#ede8de` light, `hsl(32 9% 22%)` dark): Hover fill for ghost controls, and the scrollbar thumb.

### Tertiary

- **Alarm** (`hsl(4 76% 45%)` light, `hsl(4 80% 64%)` dark): Destruction and failure only. Drop, delete, connection failure, invalid pipeline. It never appears as decoration, and it is the only hue in the system that is not amber or neutral.

### Named Rules

**The Darkening Amber Rule.** There is one amber identity, `#FFB211`, and it changes value rather than changing hue. On the dark ground it appears essentially as itself. On warm paper it reaches only 1.73:1, so it darkens to Signal Amber for anything that must be read, and survives at full strength only as a fill with black text on top (11.6:1). An amber that cannot be read is not on brand, it is broken.

**The One Chromatic Voice Rule.** Amber is the only accent hue in Mongonaut. Alarm red is a functional exception, not a second accent. The five chart hues declared in `globals.css` (`--chart-1` through `--chart-5`) are currently unused by any component; they are a reserved allowance for future data visualization and must not be borrowed for interface color.

**The Forward-Is-Lighter Rule.** In both themes the tonal ladder runs sidebar, then page, then card, and each step forward is lighter than the one behind it. Dark mode does not invert this relationship, it repeats it.

## Typography

**Display Font:** Geist Sans (`--font-geist-sans`, falling back to `ui-sans-serif`, `system-ui`, `-apple-system`)
**Body Font:** Geist Sans, the same face at smaller sizes and lighter weight
**Label/Mono Font:** Geist Mono (`--font-geist-mono`)

**Character:** One family, two cuts. Geist Sans is a neutral grotesque with the alternate character set enabled globally (`font-feature-settings: 'cv11', 'ss01'`) and `text-rendering: optimizeLegibility`, which gives it a slightly more mechanical, less humanist read than the default cut. Geist Mono appears wherever the content is literally machine syntax. The pairing is not a contrast pairing, it is a register shift: the same voice, speaking either about the data or in the data's own words.

### Hierarchy

- **Display** (600, `1.5rem`, `2rem`, `-0.025em`): The product wordmark and page-level titles. Appears at the top of About, on the empty-state welcome, and beside the logo on sign-in. One per screen.
- **Headline** (600, `1.125rem`, `1.75rem`): Section headings inside a page.
- **Title** (600, `1rem`, `1`): Card titles, dialog titles. Set at `leading-none` so the title and its description read as one block.
- **Body** (400, `0.875rem`, `1.25rem`): The working size for essentially all interface text: rows, buttons, inputs, descriptions, help text. Inputs render at `1rem` below 768px to defeat mobile zoom, then drop to `0.875rem`.
- **Label** (500, `0.75rem`, `1rem`): Field labels, badges, group headings, secondary help. Sentence case, never uppercase tracking.
- **Metric** (400, `0.6875rem`, `1rem`, tabular): The sidebar's right-aligned numbers. Document counts, collection sizes, database sizes, separated by a `/` at 40% opacity.
- **Code** (400, `0.75rem`, `1rem`, Geist Mono): Index key specs, Extended JSON hints, environment variable names, connection error strings, the confirm-by-typing target. Inline code sits on Wash at `0.25rem` horizontal padding and `6px` radius.

### Named Rules

**The Tabular Rule.** Every number a user might compare against another number renders with tabular figures. Sizes, counts, versions, sidebar badges. A byte size that shifts horizontally as it updates is a bug, not a style choice.

**The Small-Body Rule.** `0.875rem` is body text in Mongonaut, not a compact variant. `1rem` and above are reserved for titles and for the mobile input exception. Reaching for `text-base` on a row, a label or a description breaks the density the product depends on.

**The Sentence Case Rule.** Interface text is sentence case throughout, including buttons and badges. No uppercase tracking, no title case on actions. "Run aggregation", not "Run Aggregation" and not "RUN AGGREGATION".

## Layout

A fixed left rail plus one flexible content column, with a single breakpoint.

The sidebar is `16rem` wide on desktop, expands to an `18rem` sheet on mobile, and collapses to `3rem` in icon mode. It is `offcanvas`-collapsible, so on desktop it slides fully out rather than shrinking to icons, and transitions run at `200ms ease-linear` on width and position only.

The content column is a single flex column with `1rem` gaps, padded `0.5rem` below 768px and `1.5rem` above it. Below 768px it also carries `7rem` of top margin to clear the fixed mobile header, which is two stacked bars: a `3.5rem` chrome row with the trigger, wordmark and read-only pill, and a `3rem` breadcrumb row beneath it. Both use `backdrop-filter: blur(4px)` over the page ground at 80% alpha, which is the only sanctioned blur in the working interface.

Density inside a data region is set by the framed-panel rhythm: `0.75rem` horizontal padding, `0.5rem` vertical in header strips, `0.75rem` all round in panel bodies, and `0.5rem` gaps between sibling controls. Query builder rows wrap at `flex-wrap` below 768px and stay on one line above it.

`scrollbar-gutter: stable` is set on `html`, so content never shifts horizontally when a scrollbar appears. Scrollbars are custom at `8px`, track on the page ground, thumb on Accent Wash, thumb hover on Pencil.

### Named Rules

**The Single Breakpoint Rule.** 768px is the only breakpoint in the system, defined once in the mobile hook and mirrored by Tailwind's `md:`. There is no tablet layout and no desktop-wide layout. If a change needs a second breakpoint, that is a signal the composition is wrong, not that the system needs another number.

## Elevation & Depth

Borders structure, shadows float. Depth inside the page is entirely tonal and hairline: a `1px` Rule Line border plus a one-step tonal shift is the complete vocabulary for separating a region from its surroundings. A shadow means the element is not part of the page at all.

The `shadow-xs` on buttons, inputs, select triggers and switches is a vestigial hairline inherited from the component base, not elevation. Read it as a border refinement and do not extend it. The `shadow-sm` on cards and on the active tab trigger is the largest shadow permitted on anything that lives in the document flow.

### Shadow Vocabulary

- **Vestigial** (`shadow-xs`): Buttons, inputs, select triggers, switch tracks. Inherited, not meaningful. Never add it to something new to make it feel raised.
- **Seated** (`shadow-sm`): Cards, the active tab trigger, the inset sidebar variant. The maximum for in-flow surfaces.
- **Floating** (`shadow-md`): Popovers, select menus, dropdown menus, context menus. Transient surfaces anchored to a trigger.
- **Detached** (`shadow-lg`): Dialogs, sheets, dropdown submenus. Surfaces that own the screen until dismissed.

### Named Rules

**The Detachment Rule.** A shadow is a claim that the element has left the page. If the element scrolls with the content and belongs to the layout, it gets a hairline and a tonal step, never a shadow. Every `shadow-md` and `shadow-lg` in the codebase sits on a Radix portal; that correlation is the rule made visible.

## Shapes

Rectilinear and hairlined, with a base radius of `10px` (`--radius: 0.625rem`) and a four-step scale derived from it: `6px`, `8px`, `10px`, `14px`.

Corners tighten as elements get smaller and more interactive. Controls, badges and navigation rows take `8px`. Framed panels, tab strips and dialogs take `10px`. Cards and the About attribution panel take `14px`. Inline code and small chips take `6px`.

Full-round (`9999px`) is reserved for four things and nothing else: the read-only pill in the sidebar footer and mobile header, the switch track and thumb, the progress bar, and the icon medallion on the empty-state welcome. Every one of those is either a status token or a genuinely circular control.

Borders are always `1px` and always Rule Line. The stylesheet applies `border-border` globally, so a bare `border` class is already the correct color and no border utility should ever specify a hue. There is no clipping, no masking and no non-rectangular silhouette anywhere in the product.

### Named Rules

**The Inverse Corner Rule.** The smaller the element, the tighter the corner. A `14px` radius on a button, or an `8px` radius on a card, reads as a mistake in this system even though both values are in the scale.

**The Hairline-Only Rule.** Borders are `1px` Rule Line, full stop. No `2px` emphasis borders, no colored borders as a state signal, no double rules. State is carried by fill and by text color, not by border weight.

## Components

### Buttons

- **Shape:** Tight corners (`8px`), fixed heights: `2.25rem` default, `2rem` small, `1.75rem` for in-panel actions, `2.25rem` square for icon-only. Icons are `1rem` and sit `0.5rem` from the label.
- **Primary:** Ink Solid fill with Warm Paper text, `0.5rem 1rem` padding. Used for the committed action in a region: Run find, Run aggregation, Try again, dialog confirms.
- **Identity:** Zu Amber fill with black text, same geometry. Restricted to the doors into the product: sign-in, single sign-on, first-run setup, and the Zu CTA on About. It never appears inside the working interface.
- **Hover / Focus:** Fills drop to 90% alpha on hover with `transition-all`. Focus is a `3px` Focus Amber ring at 50% alpha plus a solid Focus Amber border on the element edge. Disabled drops to 50% opacity and removes pointer events.
- **Outline:** Rule Line border on the page ground, hovering to Accent Wash. The default for secondary page-level actions.
- **Ghost:** No border and no fill at rest, hovering to Accent Wash. Carries almost all row-level and panel-level actions, and is the reason the interface reads as quiet. Destructive ghosts shift their text to Alarm on hover rather than gaining a red fill.
- **Link:** Signal Amber text with a `4px` underline offset, underlined on hover. The only place amber appears as unfilled text.

### Cards / Containers

- **Corner Style:** Soft (`14px`).
- **Background:** Card Paper, one tonal step above the page.
- **Shadow Strategy:** Seated (`shadow-sm`). See Elevation & Depth.
- **Border:** `1px` Rule Line. Cards carry both a border and a tonal step; neither alone is sufficient.
- **Internal Padding:** `1.5rem` horizontal via the header, content and footer slots; `1.5rem` vertical on the card itself. Nested cards drop to `0.75rem`, as in the connection error's code block.
- Cards are for standalone compositions, sign-in, setup, About, error states. Data regions use the Framed Panel instead.

### Inputs / Fields

- **Style:** Transparent fill on the page ground with a `1px` Rule Line border, `8px` radius, `2.25rem` tall, `0.75rem` horizontal padding. In dark mode the fill becomes Rule Line at 30% alpha so the field reads as recessed rather than outlined.
- **Focus:** `3px` Focus Amber ring at 50% alpha plus a solid Focus Amber border. Transitions on `color` and `box-shadow` only, never on layout.
- **Error:** `aria-invalid` drives an Alarm border and an Alarm ring at 20% alpha (40% in dark). The attribute is the trigger; there is no separate error class.
- **Placeholder:** Pencil. Placeholders carry format examples (`field (e.g. user.age)`, `you@example.com`, `a, b, c`), never a restatement of the label.
- **Search:** The sidebar search is the one input with a leading icon: a `0.875rem` Pencil glyph absolutely positioned at `0.625rem`, with the field padded to `2rem` on the left, and forced to the page ground in both themes so it separates from Sidebar Paper.

### Navigation

- **Style:** The sidebar is a two-level collapsible tree on Sidebar Paper. Rows are `2rem` tall, `8px` radius, `0.5rem` padding, with a `1rem` leading icon in Pencil, a truncating label, and right-aligned Metric numbers.
- **Default:** Label in Sidebar Foreground (`hsl(30 10% 32%)` light, `hsl(38 14% 72%)` dark), icon and numbers in Pencil at 60% alpha.
- **Hover:** Fill shifts to the sidebar accent tone.
- **Active:** Marker Wash fill, Marker Ink label and icon, medium weight, and the row's numbers shift to Marker Ink at 75% alpha. Active state is a filled region, not an indicator bar.
- **Database rows** show a single right-aligned size. **Collection rows** show count, a `/` at 40% opacity, then size. Every one of those numbers is tabular.
- **Mobile:** The rail becomes an `18rem` sheet behind a fixed two-row header. The breadcrumb row replaces the tree as the location signal, showing database and collection with `0.75rem` Pencil icons.

### Badges

- **Outline** is the default in data contexts: transparent fill, Rule Line border, Ink text, `8px` radius, `0.75rem` type. Index attributes (`unique`, `sparse`, `ttl 3600s`), license and status markers on About.
- **Secondary** is Wash-filled and borderless, for version numbers.
- **State pill** is the exception to the corner rule: Ink Solid fill, Warm Paper text, fully round, `0.625rem` horizontal padding. Reserved for the read-only indicator in the sidebar footer and the mobile header. Its roundness is what makes it read as an instance-wide condition rather than a property of the thing next to it.

### The Framed Panel (signature component)

The recurring container for anything that holds or acts on data, and the single most characteristic shape in the product. A `10px`-radius Rule Line frame with `overflow-hidden`, an optional header strip separated by a `1px` bottom border, and a body tinted with Wash at 20% to 30% alpha.

- **Query panel:** frame tinted at 20%, header strip carrying the Find and Aggregate tab list on the left and a ghost Clear on the right at `0.75rem 0.5rem`, body at `0.75rem` with a `0.75rem` internal stack.
- **Document view:** frame with a right-aligned action strip on Wash at 30% alpha, `0.5rem 0.25rem`, holding `1.75rem` ghost Edit and Delete buttons; the JSON editor fills the body edge to edge on the page ground.
- **Index rows:** frameless variant. The same border and radius applied per row, `0.75rem 0.5rem`, name and attribute badges on the first line, the mono key spec and size on the second.
- **Embedded editors** (CodeMirror for filters and pipelines) always sit inside their own `8px` frame with `overflow-hidden`, one radius step tighter than the panel that contains them, and follow the theme through `usePreferredTheme` rather than a hardcoded editor theme.

The frame is what tells the user a region is a working surface. Never replace it with a shadow, and never let a data region float unframed on the page ground.

### Tabs

- **List:** Wash fill, `10px` radius, `2.25rem` tall, `3px` inner padding.
- **Trigger:** Transparent with a transparent border at rest so the active state does not shift layout; `8px` radius, `0.25rem 0.5rem`.
- **Active:** Page-ground fill plus Seated shadow, so the selected tab reads as lifted out of the strip. In dark mode it also gains a Rule Line border, because a tonal step alone is too subtle there.

### Dialogs

`10px` radius, page-ground fill, Rule Line border, Detached shadow, `1.5rem` padding, `1rem` grid gap, `32rem` max width. Enter and exit run at `200ms` with a 95% zoom and a fade. Destructive confirmations state the consequence in the description (`This action cannot be undone`), and the highest-risk operations require the user to type the object's name, shown in Geist Mono, before the confirm enables.

### Loading and Empty States

- **Loading:** Accent Wash blocks with `animate-pulse` and an `8px` radius, shaped like the content they replace. The sidebar renders three icon-bearing row skeletons rather than a spinner.
- **Empty:** Centered, `28rem` maximum, a `3rem` Accent Wash medallion holding a `1.5rem` icon, a Display-size line, then one Pencil sentence naming the next action. The sidebar's empty tree is instead a dashed Rule Line box with a single `0.75rem` Pencil line, so absence of data reads differently from absence of a selection.

## Do's and Don'ts

### Do:

- **Do** route amber through the two-role doctrine: `--brand` (Signal Amber) for anything read as a mark, `#FFB211` only as a fill behind black text on the doors into the product.
- **Do** give every comparable number tabular figures, at `0.6875rem` in the sidebar and `0.75rem` in badges.
- **Do** frame data regions with a `10px` Rule Line border and, where they need a header, a `1px` bottom-bordered strip at `0.75rem 0.5rem`.
- **Do** hold the control-height ladder: `2.25rem` default, `2rem` compact, `1.75rem` for actions inside a panel strip.
- **Do** keep `0.875rem` as body size and reserve `1rem` and above for titles.
- **Do** express focus as a `3px` `--ring` ring at 50% alpha plus a solid `--ring` border, on every focusable element.
- **Do** carry state through fill and text color: Marker Wash for the active row, Alarm text on destructive hover, 50% opacity for disabled.
- **Do** define new colors as bare HSL triples in both `:root` and `.dark`, and keep the contrast comments that sit above `--destructive`, `--ring` and `--sidebar-accent-foreground` current when those values change.
- **Do** let the sidebar recede: it sits one tonal step behind the page precisely so the data can be the brightest surface.

### Don't:

- **Don't** use raw `#FFB211` as text, icon or border color. It reaches 1.73:1 on the paper ground and cannot be read.
- **Don't** add a shadow to anything that scrolls with the page. Hairline plus tonal step, or nothing.
- **Don't** introduce a second accent hue. Amber is the only voice; Alarm red is functional; `--chart-1` through `--chart-5` are reserved for future data visualization and are not interface colors.
- **Don't** use pure `#000000` or `#FFFFFF` as a surface. The only sanctioned pure black is the text on a Zu Amber fill, and the only sanctioned pure white is the text on a destructive fill.
- **Don't** put a gradient in the working interface. The one gradient in the codebase is the Zu attribution panel on About, and it is attribution chrome, not product surface.
- **Don't** add blur beyond the mobile header and the About attribution panel. No glassmorphism, no translucent floating panels, no frosted overlays.
- **Don't** render data as a bordered Bootstrap-style table with grey chrome and default blue links. That is the mongo-express look this product exists to replace.
- **Don't** reach for purple or cyan gradients, glow, neon borders, or animated background shapes. The contemporary AI-tool register is a confirmed anti-reference.
- **Don't** uppercase or title-case interface text, and don't add letter-spacing to labels.
- **Don't** add a second breakpoint. 768px is the only one, and it is defined once in `useIsMobile` and mirrored by `md:`.
- **Don't** specify a border color on a border utility. `border-border` is applied globally; a hue on a border is either redundant or a violation of the Hairline-Only Rule.
- **Don't** animate layout. Transitions are limited to `color`, `box-shadow`, and the sidebar's `width` and position at `200ms ease-linear`.
