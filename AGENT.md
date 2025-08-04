# Code Guidelines — Webpage Screenshot MCP

This document front‑loads the most actionable rules for contributing code. Tool/resource names remain as code strings.

## 1) Quickstart — top rules for writing code here

- Only read and modify TypeScript sources in `src/**/*.ts`. Ignore `src/**/*.js` — they are compiled artifacts, `.gitignore`d, and not the source of truth.
- Imports:
  - Use `~/*` alias for internal modules (e.g., `~/resources/screenshots`).
  - For sibling files in the same folder, use relative paths (`./...`) — do not use the alias for siblings.
  - Use `node:` prefix for built‑ins (e.g., `node:path`, `node:fs`).
  - Prefer `import type` when it clarifies intent.
- Import ordering and grouping:
  - Group: external packages first (those starting with `@` first), then internal `~` alias imports, then local relative imports.
  - Order alphabetically by module name within each group. Separate groups with a blank line.
- Error handling: prefer [`tryCatch()`](src/utils/tryCatch.ts) utility instead of try/catch, returning tuple `[error]` or `[null, data]`; throw named domain errors when necessary.
- Logging: get your logger instance with [`logger.getLogger()`](src/utils/logger.ts), pass the `actor` argument identifying the caller of the logging mechanism. Important: you must call the `getLogger()` only during the runtime, it cannot be called in the module scope!
- Browser: get shared browser instance via [`browser.getBrowser()`](src/utils/browser.ts); handle `BrowserLaunchError`.
- Tool inputs/outputs: validate with Zod v3 `schema`
- Return structured errors with `_meta: { success: false, error: { message, errorCode }}`.
- Testing: write `*.test.ts` with Vitest (Node env); mirror path alias `~`.
- After every code-change, do a type-check (`pnpm tsc`) and lint the code (`pnpm lint`).
- Reformat with `pnpm lint:fix` before commits; Code formatting is enforced via Prettier through ESLint.

## 2) Tooling and workflow

- Formatting: Prettier (see [.prettierrc.mjs](.prettierrc.mjs:1)) — `printWidth: 144`, `singleQuote: true`.
- Linting: ESLint flat config with TypeScript; Prettier integration (`eslint-config-prettier`) and `eslint-plugin-prettier` surface formatting as warnings (`prettier/prettier: warn`).
- Commands:
  - `pnpm lint` / `pnpm lint:fix` — report and fix issues, apply formatting.
  - `pnpm test` — run Vitest once in Node env.
  - `pnpm tsc` — type‑check only.
  - `pnpm build` — production bundle using `@vercel/ncc` → single `dist/cli.js` (executable).
  - `pnpm build:tsc` — emit JS next to TS (development only; outputs are ignored by Git).
  - `pnpm dev` — same as `pnpm build:tsc`, but in watch mode (expect the developer is using this behind the scene, you should not!)
  - you could also check the final product by running `pnpm build && pnpm start`. In case of success, expect no output and server to be listening (the process keeps running)
- Artifacts: `dist` and `src/**/*.js` are generated; do not edit them.

## 3) Project structure

- `src/index.ts`: server entry; sets up logger, registers tools/resources, connects over stdio.
- `src/tools/<tool>/index.ts`: exports `schema` and `handler`; heavy logic in `utils.ts` when needed.
- `src/resources/<name>/`: resource registries and read handlers.
- `src/utils/`: shared utilities (see below).
- `src/utils/cli/`: CLI parsers and helpers.

## 4) Utils overview

- **[`src/utils/browser.ts`](src/utils/browser.ts:1)** — singleton Chromium with lazy initialization
  - Exports: `BrowserLaunchError` class, `getBrowser()`
  - launches headless Chromium once; returns browser instance;
- **[`src/utils/delay.ts`](src/utils/delay.ts:1)** — `await delay(ms)` sleep helper
- **[`src/utils/env.ts`](src/utils/env.ts)** — zod‑validated ENVs
- Exports: `env`; define your ENV vars here, so without them the code won't compile
- **[`src/utils/logger.ts`](src/utils/logger.ts:1)** — Winston logger
  - Exports: `createLogger(opts)`, `getLogger(presenter?)`
  - Modes: silent blackhole transport when `--debug` disabled; JSON file output when enabled; pretty print optional
- **[`src/utils/tryCatch.ts`](src/utils/tryCatch.ts:1)** — tuple‑based error helper
  - Exports: `tryCatch(op)`; returns `[error]` or `[null, data]`, awaitable

## 5) Logging

- User instructions about logging are in [README.md](README.md#logging), you should only focus on:
  - correctly grabbing the logger instance (`getLogger()` cannot be called in the module scope)
  - putting useful/correct logs to correct places
- Use scoped prefixes like `[🛠️ NAME_OF_THE_TOOL]`, `[📚 RESOURCE_URI]`; replace `NAME_OF_THE_TOOL`, `RESOURCE_URI` with actual values

## 6) Error handling

- Prefer `tryCatch()` for streamlined error handling; avoid using `try/catch` blocks!
- Throw named domain errors where appropriate (e.g., `BrowserLaunchError`, `CreateWebpageFileScreenshotError`, `CreateWebpageUrlScreenshotError`).
- Map errors to structured MCP responses: content with `_meta` object and user‑readable message.

## 7) MCP tools and resources

- Tools must export `schema` (zod with `.describe()` and defaults) and `handler: ToolCallback<typeof schema>`.
- Validate inputs; log start/end and errors with scoped prefixes.
- Errors: return content with `_meta` object and typed error details.
- Resources:
  - Maintain in‑memory registry (`Map`) with typed entries.
  - Read handler validates URI variables and returns meaningful errors or typed `contents`.
  - Template: **`screenshots://{screenshotId}`** (see [src/resources/screenshots](src/resources/screenshots)).

## 8) Browser management and security

- Instance: shared singleton from [`src/utils/browser.ts`](src/utils/browser.ts:1).
- URL security:
  - Accept only HTTP/HTTPS schemes; reject `file://`, `data://`, etc.
  - Progressive timeouts (e.g., 5s, 8s, 12s); isolate each screenshot in its own page context.

## 9) Testing

- Vitest in Node env; tests live next to sources as `*.test.ts`
- Test runner configuration in `vitest.config.ts`
- Global test setup in `vitest.setup.ts` handles logger initialization

### Logger Setup for Tests

**Important**: When testing code that uses `getLogger()`, the logger must be initialized first or tests will fail with "Logger has not been configured!"

**The Problem**: Vitest runs both TypeScript and compiled JavaScript modules simultaneously, creating separate module instances. If you initialize the logger in TypeScript but your code calls `getLogger()` from compiled JavaScript, the logger instances are different.

**The Solution**: Use `vitest.setup.ts` to initialize the logger in both module systems:

```javascript
// initialize logger for both TS and JS modules
try {
  const { createLogger } = require('./src/utils/logger');
  createLogger({ debugConfig: { enabled: false } });
} catch (_) {
  // module doesn't exist yet, that's fine
}

try {
  const { createLogger } = require('./src/utils/logger.js');
  createLogger({ debugConfig: { enabled: false } });
} catch (_) {
  // module doesn't exist yet, that's fine
}
```

**Writing Tests**: For code that depends on logger, no special setup needed in individual test files — the global setup handles it. Just import and test normally:

```typescript
import { addScreenshot, screenshotResources } from './index';
// logger is initialized, no need to mock
```

## 10) Adding a new tool — checklist

1. Create `src/tools/<new_tool>/`.
2. `index.ts`:
   - Export `schema` (zod) with `.describe()` and defaults.
   - Export `handler: ToolCallback<typeof schema>`.
   - Wrap I/O and 3rd party function calls with `tryCatch()` and handle errors right there.
   - Add debug/info/warn/error logging with scoped prefix.
   - keep the index file lean and lightweight, outsource the heavy lifting to `./utils.ts`
3. Register the tool in `src/index.ts`.

## 11) Adding a new resource — checklist

1. Create `src/resources/<name>/`.
2. Define types and in‑memory registry.
3. Implement `handler(uri, variables)` with validation and helpful errors.
4. Export helpers to add/update entries.
5. Register with `ResourceTemplate('scheme://{vars}', { list: undefined })` in `src/index.ts`.

## 12) Commit hygiene recap

- Ensure Prettier formatting passes (enforced via ESLint rule `prettier/prettier`).
- Resolve all TypeScript errors with `pnpm tsc`.
- Keep imports ordered and grouped:
  - `@...` packages first, then other external packages
  - internal `~` alias imports
  - local relative imports
  - separate groups with a blank line; order alphabetically within groups
- Prefer named exports and small, focused modules.
