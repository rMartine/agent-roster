# Agent Forge — Repo Conventions

## Structure
- **Monorepo**: npm workspaces with `packages/core`, `packages/extension`, `packages/cli`
- **Root config**: `tsconfig.base.json` (ES2022, Node16, strict), `.gitignore`
- **Roster content**: `agents/`, `instructions/`, `skills/`, `config/` at repo root
- **Manifest**: `agent-forge.manifest.jsonc` at repo root

## Build Order
1. `packages/core` (tsc) — must build first, produces `dist/` with declarations
2. `packages/extension` (esbuild) — bundles to `out/extension.js`
3. `packages/cli` (tsc) — compiles to `dist/`

## Module System
- Node16 module resolution, CJS output (no `"type": "module"` in package.json)
- Relative imports use `.js` extensions per Node16 convention
- Extension uses esbuild bundling, so imports resolved at build time

## Key Patterns
- Core is a pure logic library — zero VS Code deps, zero terminal I/O  
- All core functions are async, return structured result objects
- Custom errors have `actionableMessage` for user-facing display
- Path traversal protection in `paths.ts` is mandatory (rejects `..` after normalize)
- Deploy reads working tree; restore reads git HEAD
- IDs are unique across agents, instructions, and skills (shared namespace)

## Scripts
- `scripts/install.ps1` — build + VSIX package + install + CLI setup
- `scripts/uninstall.ps1` — reverse of install
