## What to build

Wire `commit-insights generate .` end-to-end: extract commits → analyze → render self-contained HTML dashboard with inline Chart.js. XSS escaping for all user content. Pre-computed aggregates only (no raw commit arrays in HTML).

### Composable template architecture

Sections are pure `(data) => string` functions — independently testable, assembled by `compose()`:

```
src/report/templates/
├── dashboard.html.ts        # compose(): calls sections, wraps in HTML shell + inlined Chart.js
├── sections/
│   ├── header.ts            # renderHeader(repoName, period) → <header> with title + date range
│   ├── metricCards.ts       # renderMetricCards(totals) → 4 stat cards (commits, files, tickets, authors)
│   ├── charts.ts            # renderChartContainers() → <canvas> wrappers (monthly bar, type doughnut, area h-bar)
│   ├── tables.ts            # renderTopTickets(tickets), renderRecentCommits(commits) — max 200, sticky header, scroll
│   ├── narrative.ts         # renderNarrativeBlock(text | undefined) → conditional card with left accent border
│   ├── footer.ts            # renderFooter(version) → generation timestamp + version
│   └── emptyState.ts        # renderEmptyState(msg, icon?) → reusable centered placeholder
├── styles.ts                # full CSS string — dark theme, grid layout, responsive breakpoints, print styles
└── chartConfigs.ts          # Chart.js config factories: monthlyActivityConfig(), typeBreakdownConfig(), areaBreakdownConfig()
```

### Design system (dark mode, developer aesthetic)

| Token | Value |
|-------|-------|
| Background | `#0d1117` |
| Surface | `#161b22` |
| Border | `#30363d` |
| Text primary | `#e6edf3` |
| Text secondary | `#8b949e` |
| Accent | `#2ea043` |
| Secondary accent | `#58a6ff` |
| Font | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |

### Layout

```
Header: repo name + path + date range
├── Metric cards row: 4 cards (commits / files / tickets / authors)
├── Charts grid (2 cols):
│   ├── Monthly Activity (bar chart, gradient fill)
│   └── Type Breakdown (doughnut, legend below, center total)
├── Charts grid (2 cols):
│   ├── Top Areas (horizontal bar, top 10)
│   └── Top Tickets (table, top 15)
├── Recent Commits — scrollable table (max 200 rows, sticky header, type badges)
├── AI Narrative (conditional — left accent border, prose max-width)
└── Footer — generation timestamp + version
```

### Chart.js integration

- Chart.js UMD bundle vendored as npm dependency, inlined at build time
- Configs built as pure factory functions in `chartConfigs.ts` — no DOM dependency, testable
- Injected into `<script>` via `jsonForScript()`
- Global defaults in page script: dark-theme colors, system font, responsive
- Chart containers: consistent `height: 280px` via CSS

### CSS architecture

Single `styles.ts` exporting a CSS string — no external stylesheets:

1. Reset + base typography
2. CSS custom properties (design tokens)
3. Layout grid (header, metric cards row, charts grid, tables)
4. Header + metric cards
5. Chart containers
6. Tables (sticky header, scroll, zebra striping, type badge pills)
7. Narrative card (left accent border)
8. Empty states (centered, muted)
9. Footer
10. Print `@media` (light bg, no gradients)
11. Responsive `@media` (collapse grids at 900px, 600px)

### Data flow

```
generate.ts → extractCommits() → analyze → StatsPayload + Commit[]
  → render.ts
      → compose(stats, recentCommits, narrative?)
          → renderHeader()
          → renderMetricCards()
          → jsonForScript(chartConfigs)
          → renderChartContainers()
          → renderTopTickets() + renderRecentCommits()
          → renderNarrativeBlock()
          → renderFooter()
          → wrap in HTML shell (CSS + inlined Chart.js)
      → writeFile("dashboard.html")
```

### Other concerns

- `src/report/escape.ts`: `escapeHtml()` (5-character HTML escape) and `jsonForScript()` (escape `</script>`, U+2028, U+2029 in JSON)
- `src/report/charts.ts`: shape aggregated data for Chart.js consumption (pre-computed, not raw)
- Chart.js MIT-licensed UMD bundle vendored as npm dependency, inlined at build time
- No CDN references in default output (`--cdn-charts` opt-in flag if added later)

## Acceptance criteria

- [ ] `commit-insights generate .` produces `dashboard.html` in current directory
- [ ] Dashboard renders correctly when opened offline (no network requests)
- [ ] Dark theme, clean typography, responsive layout
- [ ] Date range, totals, and monthly timeline chart display correctly
- [ ] Commit type breakdown chart shows feat/fix/chore/etc. counts with colored badges
- [ ] Top tickets and top areas render (or empty-state if none)
- [ ] Recent commits table shows last 200 commits max, scrollable with sticky header
- [ ] AI narrative card appears only when content is provided
- [ ] `escapeHtml` prevents XSS — `<script>` in commit subject renders as text
- [ ] `jsonForScript` prevents script-tag breakout — `</script>` in body is escaped
- [ ] Dashboard size ~250-300KB (dominated by inlined Chart.js)
- [ ] Print styles produce readable light-background output
- [ ] `--out dashboard/custom.html` writes to specified path

## Blocked by

- 003-analysis
