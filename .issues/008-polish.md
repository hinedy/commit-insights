## What to build

Final pass: add the remaining project artifacts that wrap everything up — LICENSE, `.gitignore`, `.npmignore`, config-precedence diagram, and a final proofread of all docs.

- `LICENSE` — MIT
- `.gitignore` — `dist/`, `node_modules/`, `*.db`, `.env`
- `.npmignore` — exclude tests/, .issues/, src/ (only dist/ ships)
- `README.md` — usage, privacy guarantee ("nothing leaves your machine by default"), config precedence diagram, `--narrative` opt-in note, library use note, examples
- Final proofread pass over all docs and AGENTS.md

## Acceptance criteria

- [ ] LICENSE file exists (MIT)
- [ ] `.gitignore` covers `dist/`, `node_modules/`, `*.db`, `.env`
- [ ] `.npmignore` excludes source/test from published package
- [ ] README documents the privacy guarantee, config precedence, `--narrative` being opt-in
- [ ] All documentation is internally consistent and uses `commit-insights` naming

## Blocked by

- All prior issues (001 through 007)
