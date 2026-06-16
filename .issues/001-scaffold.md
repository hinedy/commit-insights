## What to build

Initialize the project structure: `package.json`, `tsconfig.json`, `tsup` config, and a skeleton CLI that prints `--version`. The resulting `commit-insights` binary must run and pass a smoke test.

- `package.json`: name `commit-insights`, type `module`, `bin` pointing at `dist/bin/commit-insights.js`, scripts for `dev` (tsx), `build` (tsup), `test` (vitest)
- `tsconfig.json`: strict mode, ES2022 target, moduleResolution bundler
- `tsup` config (`tsup.config.ts`): bundle `src/bin/commit-insights.ts` and `src/index.ts` as ESM with `--dts --clean`; use `define: { __VERSION__: JSON.stringify(pkg.version) }` to inject version at build time, eliminating hardcoded version strings
- `src/bin/commit-insights.ts`: shebang `#!/usr/bin/env node`, calls `buildProgram().parseAsync(process.argv)` from `src/cli.ts`
- `src/cli.ts`: Commander `Command("commit-insights")` with `--version` flag only
- Build and smoke-test: `npm run build && node dist/bin/commit-insights.js --version` prints the version

## Acceptance criteria

- [x] `npm run build` produces `dist/bin/commit-insights.js` with working shebang
- [x] `node dist/bin/commit-insights.js --version` prints the version from `package.json`
- [x] `npm run dev -- --version` works via tsx
- [x] `dist/` is gitignored
- [x] TypeScript strict mode compiles without errors

## Blocked by

None - can start immediately.
