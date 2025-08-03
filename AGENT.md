# Code Guidelines — Webpage Screenshot MCP

This document summarizes the repository’s conventions for code style, quality checks, structure, and import configuration. Follow these guidelines when contributing new code to keep the codebase consistent.

## 1) Language, Runtime, Package Manager

- Language: TypeScript 5.8 in strict mode
- Runtime: Node.js 20+
- Package Manager: pnpm 10.x
- Build output:
  - Production binary is bundled with Vercel ncc into `dist/cli.js` and made executable
  - TypeScript can also be compiled with `tsc` for development (emits JS next to TS; these JS files are ignored by Git)

## 2) Code Style and Formatting

Formatting: using Prettier, see [.prettierrc.mjs](.prettierrc.mjs:1) — `printWidth: 144`, `singleQuote: true`

ESLint integrates Prettier and defers conflicting stylistic rules:

- ESLint flat config (v9+), with TypeScript via `typescript-eslint`
- Prettier integration is last to disable stylistic conflicts (`eslint-config-prettier`) and to surface formatting as warnings via `eslint-plugin-prettier` (`prettier/prettier: warn`)

Required actions:

- `pnpm lint` to report issues
- `pnpm lint:fix` to auto-fix and apply formatting

## 3) TypeScript Configuration and Import Aliases

Compiler highlights (see [tsconfig.json](tsconfig.json:1)):

- Target `es2024`; Module/Resolution `NodeNext`
- `strict: true`, `esModuleInterop: true`, `skipLibCheck: true`, `resolveJsonModule: true`
- Alias: `~/*` → `./src/*` (configured in tsconfig and mirrored in Vitest)

Note on imports: when importing a sibling local file(s), don't use aliases!. Import with a relative path instead (e.g., `./utils`).

## 4) Project Structure

High-level layout:

- `src/index.ts`: MCP server entry; setups logger, wires tools and resources; connects over stdio and logs ready
- `src/tools/...`: One directory per tool, `index.ts` exports `schema` and `handler`, heavy logic in `utils.ts`
- `src/resources/...`: Resource registries and read handlers
- `src/utils/...`: Shared utilities (`logger`, `tryCatch`, etc.)
- `src/utils/cli/...`: CLI parsers and helpers

Key modules:

- Server bootstrap (see [src/index.ts](src/index.ts:1)): registers resource template `screenshots://{screenshotId}` and tool `create_webpage_file_screenshot`
- Tool (see [src/tools/create_webpage_file_screenshot/index.ts](src/tools/create_webpage_file_screenshot/index.ts:1)): zod `schema` + `handler`; writes PNG to disk; adds in‑memory resource
- Playwright logic (see [src/tools/create_webpage_file_screenshot/utils.ts](src/tools/create_webpage_file_screenshot/utils.ts:1)): launches Chromium, navigates `file://`, screenshots (fullpage supported)
- Resource registry (see [src/resources/screenshots/index.ts](src/resources/screenshots/index.ts:1)): in‑memory map and read handler

Organizational guidance:

- New tools under `src/tools/<tool_name>/` with `index.ts` and optional `utils.ts`
- Shared code in `src/utils/`
- Resource code in `src/resources/<name>/`

## 5) Logging

Centralized via winston:

- `createLogger` initializes based on CLI flags; `getLogger` retrieves the instance or creates child loggers with `actor` metadata
- Flags: `--debug` enables logging; without path writes `debug.log` to CWD; with absolute path writes there; `--pretty-print` formats JSON

Behavior:

- No `--debug`: logs discarded via a blackhole stream
- With `--debug`: file transport with JSON format (pretty if requested)

Usage rules:

- Initialize once in entrypoint; reuse `getLogger()` across modules
- Use scoped prefixes like `[🛠️ create_webpage_file_screenshot]` and `[📚 screenshots://{screenshotId}]`

## 6) Error Handling

Pattern with tuple results:

- Use `tryCatch` which returns `[null, data]` on success or `[error]` on failure; callers branch explicitly
- Throw domain errors with clear names where appropriate (e.g., `BrowserLaunchError`, `CreateWebpageFileScreenshotError`) and map them to structured MCP responses with `_meta.success: false` and user‑readable messages

## 7) Tool and Resource Conventions (MCP)

Tools:

- Export `schema` (zod with `.describe()` and defaults) and `handler: ToolCallback<typeof schema>`
- Validate inputs and set sensible defaults
- Log start/end and errors with scoped prefixes
- On errors, return content with `_meta.success: false` and typed error details

Resources:

- Maintain in‑memory registry (`Map`) with typed entries
- Read handler validates URI variables, returns meaningful errors when missing/not found, or returns typed `contents` when found

## 8) Testing

- Vitest is configured (Node env), test files `src/**/*.test.ts`
- Excludes `dist`, `my_resources`, `node_modules`, and `**/*.js`
- Path alias `~` is mirrored in `vitest.config.ts` to match tsconfig

Guidance:

- Co‑locate tests with `.test.ts`
- Use alias imports in tests consistently

## 9) Import Rules and Examples

- Prefer `~` alias for internal imports (`~/...`)
- For local sibling files, import using relative paths (`./...`)
- Use `node:` prefix for built‑ins (`node:path`, `node:fs`, `node:process`, `node:stream`)
- Use `import type` for type‑only imports where it clarifies intent

## 10) Scripts and Developer Workflow

Core scripts and what they do (see [package.json](package.json:28)):

- `pnpm build` — production bundle using `@vercel/ncc`. Produces a single `dist/cli.js` with a shebang and sets it executable. This is the JS file executed as the MCP server binary.
- `pnpm build:tsc` — compiles all `.ts` files to `.js` files alongside the sources and then runs `tsc-alias` to rewrite path aliases. Used during development. Emitted `.js` artifacts live next to `.ts` and are `.gitignore`d; developers should not commit or hand‑edit them.
- `pnpm dev` — development watch loop: effectively `build:tsc` once and then `chokidar` watches `src/**/*.ts` to re‑run `tsc && tsc-alias` on change.
- `pnpm tsc` — type‑check only (`-noEmit`), similar to `build:tsc` but does not write any `.js` files.
- `pnpm lint` / `pnpm lint:fix` — run ESLint (with Prettier integration) and optionally autofix/format.
- `pnpm test` — run Vitest once in Node environment.
- `pnpm postinstall` hook — installs Playwright Chromium shell browser: `playwright install --with-deps --only-shell chromium`.

Workflow tips:

- For local development, run `pnpm dev` and point your IDE MCP config to the compiled `src/index.js` if needed (see README). Restart the MCP in the IDE after changes if it caches the server process.
- For distribution or end‑to‑end testing of the bundled binary, run `pnpm build` and execute `dist/cli.js`.

## 11) Folder and File Conventions

- Generated outputs (`dist`, logs) and `node_modules` are excluded from lint/tests; `src/**/*.js` is ignored in ESLint/tests in favor of TS
- Keep public entry files (`index.ts`) thin; move heavy logic to `utils.ts` or sibling modules

## 12) Adding a New Tool — Checklist

1. Create `src/tools/<new_tool>/`
2. `index.ts`:
   - Export `schema` (zod) with `.describe()` and defaults
   - Export `handler: ToolCallback<typeof schema>`
   - Wrap async work with `tryCatch`
   - Log with prefix `[🛠️ <new_tool>]`
3. Add `utils.ts` for heavy logic/I/O
4. Register tool in `src/index.ts`
5. Add tests `src/tools/<new_tool>/*.test.ts`
6. Run `pnpm lint:fix` and `pnpm test`

## 13) Adding a New Resource — Checklist

1. Create `src/resources/<name>/`
2. Define types and in‑memory registry
3. Implement `handler(uri, variables)` with validation and helpful errors
4. Export helpers to add/update entries
5. Register with `ResourceTemplate('scheme://{vars}', { list: undefined })` in `src/index.ts`
6. Add tests and logging

## 14) Commit Hygiene

- Ensure Prettier formatting passes (ESLint will warn via `prettier/prettier`)
- Resolve all TypeScript errors (`pnpm tsc`)
- Keep imports ordered and grouped
  - alphabetically ordered by the name of the module name (if the name includes `@` at the beginning, put them first)
  - new-line separating 3rd party imports from internal imports
  - internal imports use `~` alias, then follows imports from local sibling files
- Prefer named exports and small, focused modules
