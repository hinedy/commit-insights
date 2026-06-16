export const STYLES = `/* ── Tokens ──────────────────────────────────────── */
:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --border-subtle: #21262d;
  --text-primary: #e6edf3;
  --text-secondary: #8b949e;
  --text-muted: #6e7681;
  --green: #2ea043;
  --green-muted: rgba(46, 160, 67, 0.08);
  --blue: #58a6ff;
  --blue-muted: rgba(88, 166, 255, 0.08);
  --purple: #bc8cff;
  --purple-muted: rgba(188, 140, 255, 0.08);
  --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SFMono-Regular", Consolas, monospace;
}

/* ── Reset & Base ───────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  font-family: var(--font-body);
  background: var(--bg);
  color: var(--text-primary);
  line-height: 1.6;
  padding: 32px;
  max-width: 1120px;
  margin: 0 auto;
}
code, .commit-hash, .ticket-id, .type-badge {
  font-family: var(--font-mono);
}

/* ── Typography ─────────────────────────────────── */
h1, h2, h3 { text-wrap: balance; }
p { max-width: 72ch; }
a { color: var(--blue); }

/* ── Header ──────────────────────────────────────── */
.dashboard-header { margin-bottom: 28px; }
.repo-name { font-size: 1.75rem; font-weight: 700; color: var(--text-primary); letter-spacing: -0.02em; }
.repo-period { color: var(--text-secondary); margin-top: 6px; font-size: 0.875rem; }

/* ── Metric cards ───────────────────────────────── */
.metric-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
.metric-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px 20px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.metric-card::before {
  content: "";
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
}
.metric-card:nth-child(1)::before { background: var(--green); }
.metric-card:nth-child(2)::before { background: var(--blue); }
.metric-card:nth-child(3)::before { background: var(--purple); }
.metric-value { display: block; font-size: 2rem; font-weight: 700; }
.metric-card:nth-child(1) .metric-value { color: var(--green); }
.metric-card:nth-child(2) .metric-value { color: var(--blue); }
.metric-card:nth-child(3) .metric-value { color: var(--purple); }
.metric-label { display: block; font-size: 0.8125rem; color: var(--text-secondary); margin-top: 6px; text-transform: uppercase; letter-spacing: 0.06em; }

/* ── Charts ──────────────────────────────────────── */
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 32px; }
.chart-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 20px; }
.chart-wrapper h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 16px; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.04em; }
.chart-container { height: 280px; position: relative; }

/* ── Tables ──────────────────────────────────────── */
section { margin-bottom: 28px; }
section h3 { font-size: 0.9375rem; font-weight: 600; margin-bottom: 14px; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.04em; }
.table-scroll { overflow-x: auto; overflow-y: auto; max-height: 600px; border-radius: 10px; border: 1px solid var(--border); }
table { width: 100%; border-collapse: collapse; background: var(--surface); }
thead { position: sticky; top: 0; z-index: 1; }
th {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}
td { padding: 8px 14px; border-bottom: 1px solid var(--border-subtle); font-size: 0.8125rem; color: var(--text-primary); }
tr:last-child td { border-bottom: none; }
tr:nth-child(even) td { background: var(--bg); }

/* Type badges */
.type-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
.type-feat { background: rgba(46, 160, 67, 0.18); color: var(--green); }
.type-fix { background: rgba(210, 153, 34, 0.18); color: #d29922; }
.type-merge { background: rgba(201, 209, 217, 0.12); color: #c9d1d9; }
.type-other { background: rgba(139, 148, 158, 0.15); color: #b1bac4; }
.type-chore { background: rgba(139, 148, 158, 0.15); color: #b1bac4; }
.type-docs { background: rgba(88, 166, 255, 0.18); color: var(--blue); }
.type-refactor { background: rgba(188, 140, 255, 0.18); color: var(--purple); }
.type-test { background: rgba(240, 136, 62, 0.18); color: #f0883e; }
.type-style { background: rgba(63, 185, 80, 0.18); color: #3fb950; }
.type-perf { background: rgba(219, 109, 40, 0.18); color: #db6d28; }
.type-ci { background: rgba(121, 85, 72, 0.18); color: #a1887f; }
.type-build { background: rgba(96, 125, 139, 0.18); color: #90a4ae; }
.type-revert { background: rgba(227, 76, 38, 0.18); color: #e34c26; }

/* Commit table cells */
.commit-hash code { color: var(--blue); font-size: inherit; }
.ticket-count { text-align: right; font-variant-numeric: tabular-nums; }
.ticket-id { color: var(--blue); font-family: var(--font-mono); font-size: 0.8125rem; }

/* ── Narrative ───────────────────────────────────── */
.narrative-card {
  border: 1px solid rgba(46, 160, 67, 0.25);
  background: var(--green-muted);
  border-radius: 10px;
  padding: 24px;
  max-width: 720px;
  margin-bottom: 28px;
}
.narrative-card p { max-width: 65ch; color: var(--text-primary); font-size: 0.9375rem; line-height: 1.7; }
.narrative-card p + p { margin-top: 16px; }
.narrative-heading { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: var(--green); margin-bottom: 12px; }

/* ── Empty state ─────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 80px 24px 72px;
  color: var(--text-secondary);
}
.empty-icon {
  display: block;
  font-size: 2.5rem;
  line-height: 1;
  margin-bottom: 16px;
  opacity: 0.3;
  font-family: var(--font-mono);
  color: var(--text-muted);
}
.empty-state p { font-size: 1.125rem; margin: 0 auto; }

/* ── Footer ──────────────────────────────────────── */
.dashboard-footer {
  margin-top: 48px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.dashboard-footer p {
  font-size: 0.75rem;
  color: var(--text-muted);
  max-width: none;
}
.dashboard-footer .footer-badge {
  font-size: 0.6875rem;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
  font-family: var(--font-mono);
}

/* ── Print ───────────────────────────────────────── */
@media print {
  body { background: #fff; color: #000; padding: 0; max-width: none; }
  :root { --surface: #f5f5f5; --border: #ccc; --border-subtle: #ddd; --text-primary: #000; --text-secondary: #555; --text-muted: #777; --bg: #fff; }
  .chart-wrapper, .metric-card, .narrative-card { border-color: #ccc; background: #f5f5f5; }
  .metric-card::before { display: none; }
  th { background: #f5f5f5; }
  thead { display: table-header-group; }
  tr:nth-child(even) td { background: #fff; }
  .dashboard-footer { border-top-color: #ccc; }
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 960px) {
  .charts-grid { grid-template-columns: 1fr; gap: 16px; }
}
@media (max-width: 700px) {
  body { padding: 20px; }
  .metric-cards { grid-template-columns: 1fr; gap: 14px; }
}
@media (max-width: 480px) {
  body { padding: 14px; }
  .metric-card { padding: 20px 16px; }
  .chart-container { height: 220px; }
  .dashboard-footer { flex-direction: column; align-items: flex-start; }
}
`;
