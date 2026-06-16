export const STYLES = `/* Reset */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0d1117; color: #e6edf3; line-height: 1.5; padding: 24px; }
code, .commit-hash, .ticket-id, .type-badge { font-family: ui-monospace, "SFMono-Regular", Consolas, monospace; }

/* Header */
.dashboard-header { margin-bottom: 24px; }
.repo-name { font-size: 1.75rem; font-weight: 600; color: #e6edf3; }
.repo-period { color: #8b949e; margin-top: 4px; font-size: 0.875rem; }

/* Metric cards */
.metric-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.metric-card { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 20px; text-align: center; }
.metric-value { display: block; font-size: 2rem; font-weight: 700; color: #2ea043; }
.metric-label { display: block; font-size: 0.875rem; color: #8b949e; margin-top: 4px; }

/* Charts */
.charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
.chart-wrapper { background: #161b22; border: 1px solid #30363d; border-radius: 8px; padding: 16px; }
.chart-wrapper h3 { font-size: 1rem; font-weight: 600; margin-bottom: 12px; color: #e6edf3; }
.chart-container { height: 280px; position: relative; }

/* Tables */
section { margin-bottom: 24px; }
section h3 { font-size: 1rem; font-weight: 600; margin-bottom: 12px; color: #e6edf3; }
.table-scroll { overflow-x: auto; max-height: 600px; overflow-y: auto; }
table { width: 100%; border-collapse: collapse; background: #161b22; border: 1px solid #30363d; border-radius: 8px; }
thead { position: sticky; top: 0; z-index: 1; }
th { background: #161b22; border-bottom: 2px solid #30363d; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #8b949e; }
td { padding: 8px 12px; border-bottom: 1px solid #21262d; font-size: 0.875rem; }
tr:nth-child(even) td { background: #0d1117; }

/* Type badges */
.type-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
.type-feat { background: rgba(46, 160, 67, 0.2); color: #2ea043; }
.type-fix { background: rgba(210, 153, 34, 0.2); color: #d29922; }
.type-merge { background: rgba(201, 209, 217, 0.15); color: #c9d1d9; }
.type-other { background: rgba(72, 79, 88, 0.3); color: #8b949e; }
.type-chore { background: rgba(139, 148, 158, 0.2); color: #8b949e; }
.type-docs { background: rgba(88, 166, 255, 0.2); color: #58a6ff; }
.type-refactor { background: rgba(188, 140, 255, 0.2); color: #bc8cff; }
.type-test { background: rgba(240, 136, 62, 0.2); color: #f0883e; }
.type-style { background: rgba(63, 185, 80, 0.2); color: #3fb950; }
.type-perf { background: rgba(219, 109, 40, 0.2); color: #db6d28; }
.type-ci { background: rgba(121, 85, 72, 0.2); color: #795548; }
.type-build { background: rgba(96, 125, 139, 0.2); color: #607d8b; }
.type-revert { background: rgba(227, 76, 38, 0.2); color: #e34c26; }

/* Narrative */
.narrative-card { background: #161b22; border-left: 4px solid #2ea043; border-radius: 8px; padding: 20px; max-width: 720px; }
.narrative-card p { margin-bottom: 12px; }
.narrative-card p:last-child { margin-bottom: 0; }

/* Empty state */
.empty-state { text-align: center; padding: 64px 24px; color: #8b949e; font-size: 1.125rem; }

/* Footer */
.dashboard-footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #30363d; font-size: 0.75rem; color: #8b949e; }

/* Print */
@media print { body { background: #fff; color: #000; padding: 0; } .chart-wrapper, .metric-card, .narrative-card { border-color: #ccc; background: #f5f5f5; } th { background: #f5f5f5; } tr:nth-child(even) td { background: #fff; } .metric-value { color: #2ea043; } }

/* Responsive */
@media (max-width: 900px) { .charts-grid { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .metric-cards { grid-template-columns: 1fr; } body { padding: 12px; } }
`;
