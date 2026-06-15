## What to build

Final pass: add the remaining project artifacts that wrap everything up — LICENSE, `.gitignore`, `.npmignore`, config-precedence diagram, exit-code contract, progress-style CLI output, and a final proofread of all docs.

- `LICENSE` — MIT
- `.gitignore` — `dist/`, `node_modules/`, `src/report/templates/chartjs-bundle.generated.ts`, `*.db`, `.env`
- `.npmignore` — exclude tests/, .issues/, src/, scripts/ (only dist/ ships)
- `README.md` — usage, privacy guarantee ("nothing leaves your machine by default"), config precedence diagram, `--narrative` opt-in note, library use note, examples, standard env var names (`OPENAI_API_KEY` etc.)
- **Exit codes**:
  - `0` = dashboard produced (with or without narrative)
  - `1` = fatal error, or AI failure with `--strict`
- **CLI output style**: progress-style, one line per phase with timing. e.g. `Extracting commits... 1,247 commits (0.8s)`
- **CI smoke tests** at milestones: after 001 (`--version`), after 006 (first `generate`), after 008 (final)
- Final proofread pass over all docs and AGENTS.md

## Acceptance criteria

- [ ] LICENSE file exists (MIT)
- [ ] `.gitignore` covers `dist/`, `node_modules/`, `src/report/templates/chartjs-bundle.generated.ts`, `*.db`, `.env`
- [ ] `.npmignore` excludes source/test/scripts from published package
- [ ] README documents the privacy guarantee, config precedence, `--narrative` being opt-in, and standard env var names
- [ ] Exit code 0 for success (with or without narrative), exit code 1 for fatal errors or `--strict` failures
- [ ] CLI prints progress-style output per phase
- [ ] CI smoke tests run at milestones
- [ ] All documentation is internally consistent and uses `commit-insights` naming

## Blocked by

- All prior issues (001 through 007)
