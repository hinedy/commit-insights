# commit-insights — dashboard product spec

## What it is

A single self-contained `.html` file generated locally by the CLI. It requires no server, no internet connection at render time, no auth, and makes no external requests. Everything — Chart.js, styles, fonts, data — is either inlined or gracefully degrades. Opening the file is the entire product experience.

---

## Design direction

### Philosophy

The dashboard is a personal artifact, not a monitoring tool. It exists to make years of commit history feel considered and worth reading — closer to an annual report or a vinyl sleeve than a CI dashboard. The design should feel calm and premium at a glance: no visual noise, no competing accents, no boxes-within-boxes.

### Palette

| Role | Value | Usage |
|---|---|---|
| Background | `#0D0D0F` | Base — slightly warm near-black, never pure `#000` |
| Surface | `#18160F` | Rarely used; only when a background distinction is needed |
| Stone (primary text) | `#F2EDE6` | Headlines, commit subjects, numbers |
| Stone 2 (body text) | `#B8A898` | Narrative prose, secondary labels |
| Stone 3 (muted) | `#7A7060` | Timestamps, hashes, eyebrows, axis ticks |
| Amber accent | `#C4763A` | Activity bars — primary signal color, used once |
| Teal accent | `#7EB8A4` | feat type indicator only |
| Rule | `rgba(242,237,230,0.07)` | Section dividers, commit row borders |
| Rule light | `rgba(242,237,230,0.12)` | Slightly more visible rule for type bar backgrounds |

Two accent colors maximum. Neither appears in more than one context. Everything else is stone.

### Typography

| Role | Face | Weight | Notes |
|---|---|---|---|
| Hero number | Georgia / serif | 700 | One use only — the big commit count. Serif creates weight contrast without a font download |
| Body | system-ui, -apple-system, sans-serif | 300 / 400 | Prose, labels, commit subjects |
| Data / mono | ui-monospace, 'SFMono-Regular', Consolas, monospace | 400 / 500 | Hashes, dates, type labels, axis ticks, eyebrows |

No custom fonts are loaded. The system stack keeps the file self-contained and instant on first open.

### Layout

Single editorial column, `max-width: 880px`, centered, `padding: 80px 40px`. No sidebar, no fixed nav. Sections breathe apart with whitespace and `1px` hairline rules — not cards with backgrounds and borders.

**Section structure:**
- Tiny all-caps monospace eyebrow (`10px`, `0.2em` letter-spacing, stone-3 color)
- A `::after` pseudo-element extends a hairline rule to the right of the eyebrow label
- Content follows directly — no wrapper box

### Hero

The opening moment is a single large number — total commits — set in Georgia / serif at `clamp(72px, 12vw, 120px)` weight 700. The word "commits" sits inline at display size, muted. Repo name in amber mono below. Period in stone-3 below that. This is the thesis of the page — one number that summarizes everything.

### Commit type breakdown

Horizontal bars, not a donut chart. Each type gets:
- Monospace label at `11px` uppercase, `60px` fixed width
- A `3px` tall bar on a stone-rule background, filled proportionally
- Count in mono at the right

Per-type accent colors are deliberately low-contrast — they distinguish, they don't shout:

| Type | Bar | Badge bg |
|---|---|---|
| feat | `#7EB8A4` teal | rgba(126,184,164,0.15) |
| fix | `#C4763A` amber | rgba(196,118,58,0.15) |
| docs | `#609A7A` green | rgba(96,154,122,0.15) |
| refactor | `#6A9EB8` steel blue | rgba(106,158,184,0.15) |
| style | `#8A7AB0` soft violet | rgba(138,122,176,0.15) |
| test | `#A07A5A` rust | rgba(160,122,90,0.15) |
| perf | `#8A8860` gold-olive | rgba(138,136,96,0.15) |
| ci | `#4A8A9A` teal-blue | rgba(74,138,154,0.15) |
| build | `#7A8A5A` olive | rgba(122,138,90,0.15) |
| chore | `#9A8868` warm sand | rgba(154,136,104,0.2) |
| revert | `#A06A7A` rose | rgba(160,106,122,0.15) |
| merge | `#6A7A6A` cool gray | rgba(106,122,106,0.15) |
| other | `#4A4540` near-black | rgba(74,69,64,0.3) |

### Charts

Charts sit directly on the background — no wrapper box, no border, no background fill. Just the visualization floating in space. Axes use stone-3 ticks and near-invisible grid lines (`rgba(242,237,230,0.05)`). Chart.js tooltips use a custom dark-warm background (`#1A1810`) with a faint border.

### Commit log

CSS grid with four columns: hash (72px), date (96px), type (64px), subject (1fr). Row borders are hairline rules. No alternating row colors. No `<table>` element — `<div>` grid for full CSS control.

### Tickets

A compact list of ticket IDs that appear across commits, sorted by frequency (descending). Each row is a hairline rule separating the ticket ID (mono, `11px`) from its commit count (right-aligned, stone-3). Only rendered when `ticketPattern` is configured and matches are found. Capped at 15 rows.

### Area breakdown

Horizontal bars (same visual as type breakdown) mapping configured path-prefix areas to commit counts. Area label (mono, `11px`, fixed `60px` width), proportional `3px` bar on a stone-rule background, count right-aligned. Only rendered when `areas` config maps at least one path prefix. Uses the amber accent for all bars.

### Reviewers

A hairline-ruled list of contributors parsed from `Co-authored-by:` and `Approved-by:` trailers. Each entry: mono name (`11px`) → collaboration count in stone-3. Sorted descending by count. Only rendered when trailers are present.

---

## File structure (generated output)

```
dashboard.html
├── <head>
│   └── <style> — all CSS inlined (~3KB)
├── <body>
│   ├── <header class="hero"> — big commit count, repo name, period
│   ├── <div class="stats-bar"> — commits / authors / tickets inline
│   ├── <section class="narrative"> — AI-generated prose (optional)
│   ├── <section> — monthly activity bar chart
│   ├── <section> — type breakdown horizontal bars
│   ├── <section> — area breakdown bars (conditional)
│   ├── <section> — tickets list (conditional)
│   ├── <section> — reviewers list (conditional)
│   ├── <section> — commit log grid
│   └── <footer>
├── <script> — Chart.js UMD bundle, inlined (~200KB minified)
└── <script> — chart initialization
```

Total file size at this commit count: ~230KB. At 10K commits the data payload (aggregated stats only, never raw commits) adds negligible size — the Chart.js bundle dominates and is fixed.

---

## What is never embedded

- Raw commit messages beyond the recent-commits list (capped at 200 rows)
- Author emails
- File paths or diffs
- API keys or config values
- Any external `<script src>` or `<link>` that would phone home at render time

---

## Generating the dashboard

```bash
commit-insights generate [path]         # dashboard.html in current dir
commit-insights generate . --out report.html
commit-insights generate . --narrative  # requires AI provider configured
```

The `--narrative` flag calls the configured AI provider and embeds a prose summary in the Summary section. Without it, that section is omitted. The dashboard is complete and useful either way.

---

## Planned additions (not yet built)

- `--inline-fonts` flag: base64-encode the font files directly into the HTML so the file works fully offline with the custom faces
- `--theme light` variant: warm cream `#F7F3EE` background, near-black text, same amber/teal accents
