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
- Chart.js MIT-licensed UMD bundle vendored as npm dependency, inlined via **pre-build script** (`scripts/vendor-chartjs.mjs`) that generates `src/report/templates/chartjs-bundle.generated.ts` with `export const CHART_JS = '...'`
- Generated file is gitignored, rebuilt on every `npm run build` via `"prebuild"` script
- No CDN references in default output (`--cdn-charts` opt-in flag if added later)
- **Default output**: current working directory (CWD where command was run), not repo root; `--out` overrides
- **Recent commits table**: hard limit of 200 rows, no pagination, sticky header, type badge pills
- **Typography**: system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) for body; `ui-monospace, "SFMono-Regular", Consolas, monospace` for hashes, ticket IDs, and type badges

## Behaviors (one RED→GREEN cycle each)

| Cycle | Behavior | Detail |
|-------|----------|--------|
| 1 | escapeHtml escapes 5 chars | `"<script>\"&'"` → `"&lt;script&gt;&quot;&amp;&#x27;"` |
| 2 | jsonForScript escapes `</script>` | String containing `</script>` → `<\/script>` in JSON output; U+2028, U+2029 also escaped |
| 3 | Section functions produce HTML | All section functions called with fixture data → each returns non-empty string with expected HTML tags |
| 4 | compose produces valid document | All sections assembled → output starts with `<!DOCTYPE html>`, contains Chart.js bundle CSS/JS, ends with `</html>` |
| 5 | `render()` writes to CWD | Full data + `render()` → `dashboard.html` exists at CWD, non-empty, valid HTML |
| 6 | `--out` writes custom path | `--out custom/report.html` → file written at that exact path |
| 7 | Empty-state when no data | Zero commits → dashboard renders with "no commits found" placeholder, no charts |
| 8 | Narrative: conditional render | `renderNarrativeBlock("text")` → non-empty; `renderNarrativeBlock(undefined)` → `""` |
| 9 | Recent commits caps at 200 | 201 commits passed to `renderRecentCommits()` → exactly 200 `<tr>` rows |
| 10 | Chart configs produce valid objects | Chart factory functions called with fixture aggregates → returns objects with `type`, `data`, `options` fields |

## Acceptance criteria

- [ ] All 10 RED→GREEN cycles pass
- [ ] `escapeHtml` prevents XSS — `<script>` in commit subject renders as text
- [ ] `jsonForScript` prevents script-tag breakout
- [ ] `commit-insights generate .` produces valid `dashboard.html` in current directory
- [ ] Dashboard renders offline (no network requests)
- [ ] `--out` writes to specified path

## Blocked by

- 003-analysis (needs `AnalysisResult` type, not full implementation)
