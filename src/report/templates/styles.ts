export const STYLES = `/* ── Tokens ──────────────────────────────────────── */
:root {
  --bg: #0D0D0F;
  --surface: #18160F;
  --stone: #F2EDE6;
  --stone-2: #B8A898;
  --stone-3: #7A7060;
  --amber: #C4763A;
  --teal: #7EB8A4;
  --rule: rgba(242,237,230,0.07);
  --rule-light: rgba(242,237,230,0.12);
  --font-serif: Georgia, 'Times New Roman', serif;
  --font-body: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
}

/* ── Reset & Base ───────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 16px; }
body {
  font-family: var(--font-body);
  font-weight: 300;
  background: var(--bg);
  background-image:
    radial-gradient(circle, rgba(242,237,230,0.03) 0.5px, transparent 0.5px);
  background-size: 20px 20px;
  background-position: 0 0;
  background-repeat: repeat;
  color: var(--stone);
  line-height: 1.7;
  padding: 80px 40px;
  max-width: 880px;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
code, .commit-hash, .type-badge, .stats-value, .ticket-id, .reviewer-name, .eyebrow, .bar-label, .bar-count {
  font-family: var(--font-mono);
}

/* ── Typography ─────────────────────────────────── */
h2 { font-weight: 400; }
p { max-width: 72ch; color: var(--stone-2); }
.narrative-content p { max-width: none; }
a { color: var(--amber); }
a:hover { color: var(--stone); }

/* ── Eyebrow pattern ────────────────────────────── */
section { margin-bottom: 56px; }
.eyebrow {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--stone-3);
}
.eyebrow::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--rule);
}

/* ── Hero ────────────────────────────────────────── */
.hero { margin-bottom: 64px; }
.hero-row { display: flex; align-items: flex-end; gap: 12px; }
.hero-number {
  font-family: var(--font-serif);
  font-size: clamp(72px, 12vw, 120px);
  font-weight: 700;
  color: var(--stone);
  line-height: 1;
  letter-spacing: -0.03em;
}
.hero-label {
  font-family: var(--font-mono);
  font-size: 1.25rem;
  font-weight: 400;
  color: var(--stone-3);
  line-height: 1;
  margin-top: 0.35em;
}
.hero-repo {
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--amber);
  margin-top: 12px;
}
.hero-period {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--stone-3);
  margin-top: 4px;
}
.hero-period-gen {
  color: #5A5040;
}

/* ── Stats bar ──────────────────────────────────── */
.stats-bar {
  display: flex;
  width: 100%;
  margin-bottom: 56px;
  font-size: 1.125rem;
  color: var(--stone-2);
  font-weight: 400;
}
.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  gap: 4px;
}
.stats-item + .stats-item {
  border-left: 1px solid var(--rule);
}
.stats-value {
  font-variant-numeric: tabular-nums;
  color: var(--stone);
  font-size: 1.75rem;
  font-weight: 500;
  line-height: 1.1;
}
.stats-label {
  font-size: 0.6875rem;
  color: var(--stone-3);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: var(--font-mono);
}

/* ── Narrative ───────────────────────────────────── */
.narrative-section { margin-bottom: 56px; }
.narrative-section .eyebrow { margin-bottom: 24px; }
.narrative-content { font-size: 0.9375rem; line-height: 1.8; }
.narrative-content p + p { margin-top: 18px; }

/* ── Charts ──────────────────────────────────────── */
.chart-container { height: 220px; position: relative; margin-bottom: 0; }

/* ── Type bars ───────────────────────────────────── */
.type-bars, .area-bars { display: flex; flex-direction: column; gap: 12px; }
.bar-row { display: flex; align-items: center; gap: 16px; }
.bar-label {
  min-width: 60px;
  flex-shrink: 0;
  font-size: 0.6875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--stone-3);
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-track {
  flex: 1;
  height: 4px;
  background: var(--rule-light);
  border-radius: 2px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s ease;
}
.bar-count {
  width: 32px;
  flex-shrink: 0;
  font-size: 0.6875rem;
  color: var(--stone-3);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.bar-type-feat { background: var(--teal); }
.bar-type-fix { background: var(--amber); }
.bar-type-chore { background: #9A8868; }
.bar-type-style { background: #8A7AB0; }
.bar-type-refactor { background: #6A9EB8; }
.bar-type-docs { background: #609A7A; }
.bar-type-test { background: #A07A5A; }
.bar-type-perf { background: #8A8860; }
.bar-type-ci { background: #4A8A9A; }
.bar-type-build { background: #7A8A5A; }
.bar-type-revert { background: #A06A7A; }
.bar-type-merge { background: #6A7A6A; }
.bar-type-other { background: #4A4540; }

.bar-type-area { background: var(--amber); }

/* ── Commit log ──────────────────────────────────── */
.commit-scroll {
  max-height: 600px;
  overflow-y: auto;
  border-top: 1px solid var(--rule);
}
.commit-scroll::-webkit-scrollbar { width: 6px; }
.commit-scroll::-webkit-scrollbar-track { background: transparent; }
.commit-scroll::-webkit-scrollbar-thumb { background: #3A3630; border-radius: 3px; }
.commit-scroll::-webkit-scrollbar-thumb:hover { background: #5A5040; }
.commit-scroll { scrollbar-width: thin; scrollbar-color: #3A3630 transparent; }
.commit-grid-header {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg);
  border-bottom: 1px solid var(--rule);
}
.commit-grid-header .commit-cell {
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--stone-3);
  padding: 10px 8px;
}
.commit-row {
  display: flex;
  border-bottom: 1px solid var(--rule);
}
.commit-row:last-child { border-bottom: none; }
.commit-row .commit-cell {
  padding: 10px 8px;
  font-size: 0.8125rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.commit-cell.hash { width: 72px; flex-shrink: 0; font-family: var(--font-mono); color: var(--stone-3); font-size: 0.75rem; }
.commit-cell.date { width: 96px; flex-shrink: 0; font-family: var(--font-mono); color: var(--stone-3); font-size: 0.75rem; }
.commit-cell.type { width: 64px; flex-shrink: 0; }
.commit-cell.subject { flex: 1; min-width: 0; color: var(--stone); }
.commit-cell .type-badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: 0.625rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.type-feat { background: rgba(126,184,164,0.15); color: var(--teal); }
.type-fix { background: rgba(196,118,58,0.15); color: var(--amber); }
.type-chore { background: rgba(154,136,104,0.2); color: #9A8868; }
.type-style { background: rgba(138,122,176,0.15); color: #8A7AB0; }
.type-refactor { background: rgba(106,158,184,0.15); color: #6A9EB8; }
.type-docs { background: rgba(96,154,122,0.15); color: #609A7A; }
.type-test { background: rgba(160,122,90,0.15); color: #A07A5A; }
.type-perf { background: rgba(138,136,96,0.15); color: #8A8860; }
.type-ci { background: rgba(74,138,154,0.15); color: #4A8A9A; }
.type-build { background: rgba(122,138,90,0.15); color: #7A8A5A; }
.type-revert { background: rgba(160,106,122,0.15); color: #A06A7A; }
.type-merge { background: rgba(106,122,106,0.15); color: #6A7A6A; }
.type-other { background: rgba(74,69,64,0.3); color: #4A4540; }

/* ── Side-by-side grid ──────────────────────────── */
.side-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 56px; }
.side-grid > section { margin-bottom: 0; }

/* ── Ticket / Reviewer list ──────────────────────── */
.ticket-list, .reviewer-list { list-style: none; }
.ticket-list li, .reviewer-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--rule);
}
.ticket-list li:last-child, .reviewer-list li:last-child { border-bottom: none; }
.ticket-id, .reviewer-name {
  font-size: 0.75rem;
  color: var(--stone);
  font-weight: 400;
}
.ticket-count, .reviewer-count {
  font-size: 0.75rem;
  color: var(--stone-3);
  font-variant-numeric: tabular-nums;
  font-family: var(--font-mono);
}

/* ── Empty state ─────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 80px 24px;
  color: var(--stone-2);
}
.empty-state p { font-size: 1rem; margin: 0 auto; color: var(--stone-2); }

/* ── Scroll-in animation ─────────────────────────── */
section { opacity: 0; transform: translateY(6px); transition: opacity 0.5s ease-out, transform 0.5s ease-out; }
section.section-visible { opacity: 1; transform: translateY(0); }

/* ── Footer ──────────────────────────────────────── */
.dashboard-footer {
  margin-top: 80px;
  padding-top: 20px;
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
}
.dashboard-footer p {
  font-size: 0.6875rem;
  color: var(--stone-3);
  max-width: none;
  font-family: var(--font-mono);
}
.dashboard-footer .footer-badge {
  font-size: 0.625rem;
  color: var(--stone-3);
  border: 1px solid var(--rule);
  border-radius: 10px;
  padding: 2px 8px;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* ── Print ───────────────────────────────────────── */
@media print {
  body { background: #fff; color: #000; padding: 0; max-width: none; -webkit-font-smoothing: auto; -moz-osx-font-smoothing: auto; }
  :root { --stone: #000; --stone-2: #555; --stone-3: #777; --bg: #fff; --rule: #ddd; --rule-light: #ddd; }
  section { opacity: 1; transform: none; }
  .stats-item + .stats-item { border-left-color: #ddd; }
  .dashboard-footer { border-top-color: #ddd; }
}

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 700px) {
  body { padding: 48px 24px; }
  .hero { margin-bottom: 48px; }
  .stats-item { padding: 16px 12px; }
  .stats-value { font-size: 1.375rem; }
  .commit-grid-header { display: none; }
  .commit-cell.hash { width: 56px; }
  .commit-cell.date { width: 80px; }
  .commit-cell.type { width: 56px; }
}
@media (max-width: 480px) {
  body { padding: 32px 16px; }
  .commit-grid-header { display: none; }
  .commit-row { flex-wrap: wrap; gap: 0; }
  .commit-row .commit-cell { padding: 4px 8px; border-bottom: none; }
  .commit-row .commit-cell.hash { width: auto; order: 1; }
  .commit-row .commit-cell.date { width: auto; order: 2; }
  .commit-row .commit-cell.type { width: 100%; order: 3; padding-top: 0; }
  .commit-row .commit-cell.subject { width: 100%; flex: none; order: 4; padding-top: 0; }
  .dashboard-footer { flex-direction: column; align-items: flex-start; }
}

@media (prefers-reduced-motion: reduce) {
  section { opacity: 1; transform: none; transition: none; }
}
`;
