# Product

## Register

product

## Users

Individual developers running a CLI to generate contribution reports for their own git repositories. They are at their terminal, in a developer mindset — building, shipping, reflecting on work. They land on the dashboard after a CLI command, expecting a single self-contained HTML file they can open in any browser, even offline.

## Product Purpose

commit-insights generates a local, self-contained git contribution dashboard (static HTML) from a repo's commit history. It exists to give developers a quick, private visual summary of their work — no data ever leaves the machine. Success looks like: a developer runs one command, opens the HTML, and immediately understands the rhythm and shape of their contributions.

## Brand Personality

Honest, developer-tool direct, no-marketing. The confidence of a tool that respects your privacy and your terminal. Three words: clear, capable, reserved.

## Anti-references

- SaaS dashboards with gradients, glassmorphism, and "analytics" chrome (Mixpanel, Amplitude). This is not a hosted product — it's a local HTML file.
- Marketing-heavy tool pages that oversell. This tool does one thing and does it quietly.
- Light-mode-default tools for a dark-mode developer audience.
- Card-heavy layouts without semantic structure. Cards are the lazy answer.

## Design Principles

1. **Practice what you preach** — the dashboard renders offline, loads instantly, and respects the user's machine. Every byte earns its place.
2. **Data-forward, not decoration-forward** — the commit data is the hero. Visual decisions clarify the data; they never compete with it.
3. **Terminal-honest aesthetic** — the dashboard lives between the terminal (where it was generated) and the browser. Monospace where it counts (hashes, tickets, types), generous whitespace, no faux-glass or illustration.
4. **Expert confidence** — the UI assumes the user is a developer who can read a table and interpret a chart. No handholding, no big-number-hero-metric staging.
5. **Ship one file** — no CDN dependencies, no external fonts, no network requests. The HTML file is the artifact.

## Accessibility & Inclusion

- WCAG AA contrast minimum (4.5:1 body text, 3:1 large text). No exceptions for dark theme.
- Print styles for saving to PDF or paper.
- `prefers-reduced-motion` respected.
- Colour not the sole differentiator (type badges use text + color).
