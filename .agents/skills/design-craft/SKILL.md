---
name: design-craft
description: Visual design craft, anti-AI-slop standards, and proven Vercel UI SDK + Tailwind v4 working patterns for Builder and every app Builder generates.
---

# Design Craft & Anti-Slop Standards

Build interfaces that feel authored by a seasoned product designer and frontend engineer — calm, tactile, scannable, and free of telltale AI-generated clichés.

## Remove Typical "AI Created This" Tells

- **No cliché AI icons:** Never use `Sparkles`, `Wand2`, `Brain`, `Bot`, or `Rocket` icons as decorative accents on headings, buttons, pills, or chat headers. Use quiet functional icons (`ArrowUp`, `ArrowUpRight`, `ChevronDown`, `Check`, `Plus`, `X`, `SlidersHorizontal`, `Play`, `Pause`, `RotateCcw`) only when they aid scanning.
- **No self-referential model/stack hype pills:** Never put "Powered by Gemini / AI / UI SDK" badges in headers, hero sections, or nav bars.
- **No decorative fake OS window chrome:** Never put fake macOS red/yellow/green or gray 3-dot traffic lights on dashboard cards or app containers.
- **No colored left-border accent stripes:** Never style cards or alerts with a thick `border-left: 3px/4px solid <color>`. Use subtle `1px` borders, clean surface contrast, and clear typographic hierarchy.
- **No AI color clichés or nested-box clutter:** Avoid purple-blue gradients, glowing neon shadows, heavy glassmorphism, or boxes-inside-boxes. Use calm neutral backgrounds, crisp `1px` hairline dividers, and generous whitespace.
- **No emoji in UI chrome:** Keep headings, buttons, tabs, and badges free of emoji.
- **Calm, human copy:** Avoid exclamation-heavy hype, sales filler ("seamless", "robust", "comprehensive", "leverage"), and em-dash overuse. Write short, direct labels.
- **Clean code (unslop):** No comments that restate the next line, no section banners (`// === Helpers ===`), no TODO/FIXME stubs, no unused props or dead wrappers.

## Proven Vercel UI SDK + Tailwind v4 Working Patterns

1. **CSS layer order (`src/index.css`):**
   Always declare in this exact order:
   ```css
   @layer ui-sdk;
   @import "tailwindcss";
   @import "@ui-sdk/core/web.css" layer(components);
   ```
   Set `color-scheme: light;` (or explicit dark theme tokens) and `--ui-*` tokens on `:root` so `@ui-sdk/core/web.css` harmonizes with your palette without fighting it via `!important`.

2. **Per-component `@ui-sdk/react/*` entry imports:**
   Always import from component entries (`@ui-sdk/react/tabs`, `@ui-sdk/react/select`, `@ui-sdk/react/dialog`, `@ui-sdk/react/popover`, `@ui-sdk/react/switch`, `@ui-sdk/react/segmented-control`, `@ui-sdk/react/progress`), never from the package root. Never hand-roll `role="tablist"`, `role="dialog"`, `role="listbox"`, or `role="switch"`.

3. **Gotchas learned from `@ui-sdk/core/web.css`:**
   - **Switches:** `web.css` shifts `[data-slot="switch-thumb"][data-checked]` using `margin-inline-start: auto;`. If you customize thumb translation with `transform: translateX(...)`, explicitly set `margin-inline-start: 0;` on both unchecked and `[data-checked]` states so the thumb is never double-shifted out of its track.
   - **Select items with icons:** Always place plain text directly inside `<SelectItemText>` and provide a string `label` prop on `<SelectItem>` when rendering an icon alongside the text so the selected value and accessible name never fall back to raw option values.
   - **Right-anchored Dialog drawers:** `web.css` centers `[data-slot="dialog-content"]`. For slide-over drawers, explicitly set `inset: 0 0 0 auto; left: auto; right: 0; height: 100vh; margin: 0;`.
   - **Single-line controls & metadata:** Put `white-space: nowrap; flex-shrink: 0;` on buttons and metadata chips, and `overflow: hidden; text-overflow: ellipsis;` on dynamic identifiers (like branch names or URLs).
   - **Numbers & timers:** Always apply `font-variant-numeric: tabular-nums;` to counters, prices, metrics, and countdown timers so digits never jitter.
