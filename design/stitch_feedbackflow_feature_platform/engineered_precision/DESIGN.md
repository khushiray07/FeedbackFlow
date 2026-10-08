---
name: Engineered Precision
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4b41e1'
  on-secondary: '#ffffff'
  secondary-container: '#645efb'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  surface-canvas: '#F8FAFC'
  surface-card: '#FFFFFF'
  surface-elevated: '#FFFFFF'
  border-subtle: '#E2E8F0'
  border-strong: '#CBD5E1'
  border-focus: '#0F172A'
  text-primary: '#0F172A'
  text-secondary: '#475569'
  text-muted: '#94A3B8'
  status-review-bg: '#F5F3FF'
  status-review-text: '#6D28D9'
  status-review-border: '#DDD6FE'
  status-planned-bg: '#FFFBEB'
  status-planned-text: '#B45309'
  status-planned-border: '#FDE68A'
  status-progress-bg: '#EEF2FF'
  status-progress-text: '#4338CA'
  status-progress-border: '#C7D2FE'
  status-completed-bg: '#ECFDF5'
  status-completed-text: '#047857'
  status-completed-border: '#A7F3D0'
  tag-feature-bg: '#F1F5F9'
  tag-feature-text: '#334155'
  tag-bug-bg: '#FEF2F2'
  tag-bug-text: '#B91C1C'
  tag-improvement-bg: '#F0FDF4'
  tag-improvement-text: '#15803D'
  tag-integration-bg: '#FAF5FF'
  tag-integration-text: '#7E22CE'
  interactive-active-bg: '#EEF2FF'
  interactive-active-border: '#6366F1'
  interactive-active-text: '#4338CA'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-md:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  mono-metric:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: -0.01em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies high-craft SaaS utility, engineered for clarity, speed, and structural precision. It targets technical product managers, engineers, designers, and discerning software consumers who prioritize information hierarchy over decorative noise. Inspired by tools like Linear and Raycast, the aesthetic balances modern minimalism with tactile digital mechanics: sharp division lines, calibrated typography, micro-interactions with immediate feedback, and dense metadata displays.

The interface evokes competence, deliberate focus, and momentum. It steers clear of playful skeuomorphism and excessive ambient blur, relying instead on 1px crisp borders, calibrated tonal backgrounds, high-contrast semantic indicators, and purposeful typography to establish spatial order.

## Colors

The color palette centers on a disciplined neutral axis ranging from pure white through cool slate tones to deep ink (`#0F172A`). Deep ink serves as the primary anchor for headers, primary CTA buttons, and focused borders, while indigo (`#4F46E5`) provides secondary emphasis for active states, selected filters, and interactive cues.

### Semantic Status Colors
Roadmap stages use consistent tinted badges with 1px borders for immediate identification:
- **Under Review**: Violet (`#6D28D9` text, `#F5F3FF` background, `#DDD6FE` border)
- **Planned**: Amber (`#B45309` text, `#FFFBEB` background, `#FDE68A` border)
- **In Progress**: Blue/Indigo (`#4338CA` text, `#EEF2FF` background, `#C7D2FE` border)
- **Completed**: Emerald (`#047857` text, `#ECFDF5` background, `#A7F3D0` border)

### Category & Feedback Tags
Category chips use dedicated tints to keep data grids and boards parseable at a glance:
- **Feature**: Slate neutral (`#334155` / `#F1F5F9`)
- **Bug**: Crimson warning (`#B91C1C` / `#FEF2F2`)
- **Improvement**: Emerald utility (`#15803D` / `#F0FDF4`)
- **Integration**: Purple nuance (`#7E22CE` / `#FAF5FF`)

Always use the border tokens (`border-subtle` and `border-strong`) for structural separation rather than relying solely on differing background fills.

## Typography

Typography relies on `Geist` across all core layers, paired with `JetBrains Mono` for tabular figures, upvote counts, and metadata badges. 

Headings feature tight tracking (`letter-spacing: -0.02em` to `-0.025em`) to evoke the dense, engineered typography of high-velocity developer tools. Line heights are kept intentionally compact to maintain high data density on complex roadmaps and dashboard tables. Body text utilizes standard tracking to ensure scan-efficiency when reading multi-line feedback descriptions. Monospaced numeric counters (`mono-metric`) ensure that upvote quantities and badge figures do not cause layout reflows as totals shift dynamically.

## Layout & Spacing

Layout execution relies on structural grids calibrated across three major responsive breakpoints:

- **Desktop (1024px+)**: The Roadmap Kanban displays a 4-column lane grid (`gutter-lg: 1.5rem`), with horizontal scrolling restricted only if lanes fall below a 280px minimum width constraint. The admin dashboard uses full-width edge-to-edge data tables with fixed left-pinned columns and 1.25rem cell paddings. Outer page margin defaults to `2rem`.
- **Tablet (768px - 1023px)**: The Kanban grid transitions to a 2x2 grid or horizontally pannable column track with snap-points. Margins scale down to `1.5rem`.
- **Mobile (< 768px)**: Kanban lanes convert to a tabbed segment control (`Under Review | Planned | In Progress | Completed`) showing one column at a time. The feedback board condenses to a single vertical stack. Margins collapse to `1rem`.

Component spacing follows a modular 4px grid. Feedback cards use `space-md` (0.75rem) to `space-lg` (1.25rem) internal padding to maintain high information density while preventing visual collision.

## Elevation & Depth

This system intentionally departs from diffuse, heavy drop-shadows. Depth is articulated through low-contrast 1px outlines (`#E2E8F0`), hairline inset borders, and crisp, micro-elevation.

- **Level 0 (Flat Surface)**: The global page background uses `#F8FAFC`.
- **Level 1 (Card & Lane Surface)**: Feedback cards and Kanban columns sit on `#FFFFFF`, delineated by a 1px solid border (`#E2E8F0`). On hover, cards do not lift high; they transition their border to `#CBD5E1` with a micro-shadow: `0 1px 3px rgba(15, 23, 42, 0.05)`.
- **Level 2 (Popovers & Dropdowns)**: Menus, status select pickers, and filter popovers use `#FFFFFF`, a 1px border (`#E2E8F0`), and a sharp double shadow: `0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)`.
- **Level 3 (Modals & Overlays)**: The feedback submission modal is framed with a 1px solid `#CBD5E1` border and backed by `rgba(15, 23, 42, 0.4)` backdrop with an 8px blur filter (`backdrop-filter: blur(8px)`). Shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)`.

## Shapes

The shape philosophy is sharp, disciplined, and functional. Elements use a tight `0.25rem` (4px) to `0.375rem` (6px) radius for micro components (tags, inputs, upvote counters, and buttons), creating a precise engineering aesthetic.

Cards, Kanban lane containers, and dashboard table wrappers employ `0.5rem` (8px, `rounded-lg`). Modals use `0.75rem` (12px, `rounded-xl`). Fully circular pill shapes are disallowed, except for small circular status indicator dots (4px-6px).

## Components

### Buttons
- **Primary**: Background `#0F172A`, text `#FFFFFF`, border 1px solid `#0F172A`. Hover: `#1E293B`. Active: `#334155`. Height: 36px, padding: 0 14px, font: `label-md`.
- **Secondary**: Background `#FFFFFF`, text `#0F172A`, border 1px solid `#CBD5E1`. Hover: `#F8FAFC`, border `#94A3B8`.
- **Ghost/Tertiary**: Background transparent, text `#475569`. Hover: `#F1F5F9`, text `#0F172A`.

### Interactive Upvote Button
A specialized vertical card-integrated button:
- **Default State**: Flex column layout (chevron icon top, count bottom), width: 44px, height: 52px. Background `#F8FAFC`, border 1px solid `#E2E8F0`, text `#475569`. Counter uses `mono-metric`. Hover: background `#F1F5F9`, border `#CBD5E1`, text `#0F172A`.
- **Active / Voted State**: Background `#EEF2FF`, border 1px solid `#6366F1`, text `#4338CA`. Chevron shifts to a filled variant with a subtle scale pop on activation.

### Status Badges & Category Tags
- **Status Badges**: Border radius 4px, height 22px, padding 2px 8px. Typography is `label-sm` in uppercase with 0.02em letter spacing. Includes a 6px solid circular dot preceding the text indicating stage color.
- **Category Chips**: Height 20px, padding 2px 6px, border radius 4px. Typographic level `label-sm` in sentence case.

### Cards
- **Feedback Card**: Solid `#FFFFFF` surface, 1px border `#E2E8F0`, padding `1rem`. Internal grid places the Upvote Button left-aligned, followed by the content group (Title in `headline-sm`, Description snippet in `body-sm`, and metadata row containing category chip, comment count, and status badge).

### Inputs & Forms
- Background `#FFFFFF`, border 1px solid `#CBD5E1`, border-radius 6px, font `body-md`. Height 38px (single-line).
- Focus: 1px outline/border `#0F172A` with a 0 0 0 1px `#0F172A` ring. Placeholder text `#94A3B8`.

### Kanban Lanes & Moderation Tables
- **Kanban Lanes**: Background `#F8FAFC` container with 1px solid `#E2E8F0` border, padding 12px. Column header displays status title, colored count indicator, and an action slot.
- **Admin Moderation Table**: Bordered rows with 1px border-bottom `#E2E8F0`. Header row background `#F8FAFC`, typography `label-sm` in slate muted. Row hover triggers `#F8FAFC`.

### Checkboxes & Radios
- Size: 16px x 16px, border 1px solid `#CBD5E1`, border radius 4px for checkboxes, full circle for radios. Checked state: `#0F172A` fill with white checkmark/dot.