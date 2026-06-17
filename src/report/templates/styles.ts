export const STYLES = `/* ── Tokens ──────────────────────────────────────── */
:root {
  --bg: #080808;
  --surface: rgba(255, 255, 255, 0.04);
  --surface-raised: rgba(255, 255, 255, 0.07);
  --border: rgba(255, 255, 255, 0.08);
  --border-subtle: rgba(255, 255, 255, 0.04);
  --text-primary: #f0f2f5;
  --text-secondary: #a0aaba;
  --text-muted: #6b7280;
  --accent-silver: #e2e8f0;
  --green: #34d399;
  --green-muted: rgba(52, 211, 153, 0.12);
  --blue: #60a5fa;
  --blue-muted: rgba(96, 165, 250, 0.12);
  --purple: #a78bfa;
  --purple-muted: rgba(167, 139, 250, 0.12);
  --yellow: #fbbf24;
  --orange: #fb923c;
  --red: #f87171;
  --pink: #f472b6;
  --teal: #2dd4bf;
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}

/* ── Reset & Base ───────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.7;
  padding: 44px 32px;
  max-width: 1200px;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
code, .commit-hash, .ticket-id, .type-badge, .metric-value {
  font-family: var(--font-mono);
}

/* ── Typography ─────────────────────────────────── */
h1, h2, h3 { text-wrap: balance; font-weight: 600; }
p { max-width: 72ch; }
a { color: var(--blue); }
a:hover { color: var(--text-primary); }

/* ── Section pattern ────────────────────────────── */
section { margin-bottom: 48px; }
.section-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  margin-bottom: 20px;
}

/* ── Header ──────────────────────────────────────── */
.dashboard-header { margin-bottom: 48px; }
.repo-name { font-size: 2.25rem; font-weight: 600; color: var(--text-primary); letter-spacing: -0.025em; line-height: 1.2; }
.repo-period { color: var(--text-secondary); margin-top: 8px; font-size: 0.8125rem; font-family: var(--font-mono); }

/* ── Metric cards ───────────────────────────────── */
.metric-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 48px; }
.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px 20px;
  text-align: center;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.metric-card:hover { background: var(--surface-raised); border-color: rgba(255,255,255,0.14); }
.metric-value { display: block; font-size: 2.25rem; font-weight: 400; color: var(--text-primary); line-height: 1; letter-spacing: -0.02em; }
.metric-label { display: block; font-size: 0.625rem; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-muted); margin-top: 8px; }

/* ── Narrative ───────────────────────────────────── */
.narrative-content { max-width: 72ch; color: var(--text-primary); font-size: 0.9375rem; line-height: 1.8; padding-right: 40px; }
.narrative-content p + p { margin-top: 18px; }

/* ── Charts ──────────────────────────────────────── */
.chart-full { margin-bottom: 20px; }
.charts-split { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
.chart-wrapper h3 { font-size: 0.625rem; font-weight: 500; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 20px; }
.chart-container { height: 260px; position: relative; }

/* ── Tables ──────────────────────────────────────── */
.table-scroll { overflow-x: auto; overflow-y: auto; max-height: 600px; border-radius: 12px; border: 1px solid var(--border); }
table { width: 100%; border-collapse: collapse; background: var(--surface); }
thead { position: sticky; top: 0; z-index: 1; }
th {
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  font-size: 0.625rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}
td { padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); font-size: 0.8125rem; color: var(--text-primary); }
tr:last-child td { border-bottom: none; }
tr:hover td { background: var(--surface-raised); }

/* Type badges */
.type-badge { display: inline-block; padding: 2px 10px; border-radius: 8px; font-size: 0.625rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid transparent; }
.type-feat { background: var(--green-muted); color: var(--green); border-color: rgba(52, 211, 153, 0.2); }
.type-fix { background: rgba(251, 191, 36, 0.12); color: var(--yellow); border-color: rgba(251, 191, 36, 0.2); }
.type-merge { background: rgba(255, 255, 255, 0.06); color: var(--accent-silver); border-color: rgba(255, 255, 255, 0.1); }
.type-other { background: rgba(255, 255, 255, 0.04); color: var(--text-muted); border-color: rgba(255, 255, 255, 0.06); }
.type-chore { background: rgba(255, 255, 255, 0.04); color: var(--text-muted); border-color: rgba(255, 255, 255, 0.06); }
.type-docs { background: var(--blue-muted); color: var(--blue); border-color: rgba(96, 165, 250, 0.2); }
.type-refactor { background: var(--purple-muted); color: var(--purple); border-color: rgba(167, 139, 250, 0.2); }
.type-test { background: rgba(248, 113, 113, 0.12); color: var(--red); border-color: rgba(248, 113, 113, 0.2); }
.type-style { background: rgba(52, 211, 153, 0.12); color: var(--green); border-color: rgba(52, 211, 153, 0.2); }
.type-perf { background: rgba(251, 146, 60, 0.12); color: var(--orange); border-color: rgba(251, 146, 60, 0.2); }
.type-ci { background: rgba(167, 139, 250, 0.12); color: var(--purple); border-color: rgba(167, 139, 250, 0.2); }
.type-build { background: rgba(45, 212, 191, 0.12); color: var(--teal); border-color: rgba(45, 212, 191, 0.2); }
.type-revert { background: rgba(248, 113, 113, 0.12); color: var(--red); border-color: rgba(248, 113, 113, 0.2); }

/* Commit table cells */
.commit-hash code { color: var(--accent-silver); font-size: inherit; letter-spacing: 0.02em; }
.commit-date { color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.75rem; }
.commit-subject { color: var(--text-primary); }
.commit-area { color: var(--text-secondary); font-family: var(--font-mono); font-size: 0.75rem; }
.commit-tickets { color: var(--text-muted); font-family: var(--font-mono); font-size: 0.75rem; }
.ticket-count { text-align: right; font-variant-numeric: tabular-nums; color: var(--text-secondary); font-family: var(--font-mono); }
.ticket-id { color: var(--accent-silver); font-family: var(--font-mono); font-size: 0.8125rem; letter-spacing: 0.02em; }

/* ── Empty state ─────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 88px 24px 80px;
  color: var(--text-secondary);
}
.empty-icon {
  display: block;
  font-size: 2rem;
  line-height: 1;
  margin-bottom: 16px;
  opacity: 0.25;
  font-family: var(--font-mono);
  color: var(--text-muted);
  letter-spacing: 0.1em;
}
.empty-state p { font-size: 1.125rem; margin: 0 auto; color: var(--text-secondary); }

/* ── Footer ──────────────────────────────────────── */
.dashboard-footer {
  margin-top: 64px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}
.dashboard-footer p {
  font-size: 0.6875rem;
  color: var(--text-muted);
  max-width: none;
  font-family: var(--font-mono);
}
.dashboard-footer .footer-badge {
  font-size: 0.625rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Print ───────────────────────────────────────── */
@media print {
  body { background: #fff; color: #000; padding: 0; max-width: none; -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; }
  :root { --surface: #f5f5f5; --surface-raised: #eee; --border: #ccc; --border-subtle: #ddd; --text-primary: #000; --text-secondary: #555; --text-muted: #777; --bg: #fff; --accent-silver: #333; }
  .chart-wrapper, .metric-card, .narrative-content { border-color: #ccc; background: #f5f5f5; }
  th { background: #eee; }
  thead { display: table-header-group; }
  tr:hover td { background: transparent; }
  .dashboard-footer { border-top-color: #ccc; }
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 960px) {
  .charts-split { grid-template-columns: 1fr; gap: 16px; }
}
@media (max-width: 700px) {
  body { padding: 24px 20px; }
  .metric-cards { grid-template-columns: 1fr; gap: 12px; }
  .dashboard-header { margin-bottom: 32px; }
  .repo-name { font-size: 1.75rem; }
  .narrative-content { padding-right: 0; }
}
@media (max-width: 480px) {
  body { padding: 16px 14px; }
  .metric-card { padding: 20px 16px; }
  .chart-container { height: 220px; }
  .dashboard-footer { flex-direction: column; align-items: flex-start; }
}
`;
