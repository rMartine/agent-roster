# Non-Functional Requirements

## Overview

Cross-cutting requirements that apply to all features of Agent Forge.

## Platform & Compatibility

| Requirement | Target |
|-------------|--------|
| **OS (MVP)** | Windows 10/11 (PowerShell 5.1+) |
| **OS (future)** | macOS, Linux (deferred) |
| **VS Code version** | 1.85+ (minimum supporting current agent/prompt file conventions) |
| **Node.js** | >= 18.x LTS |
| **Git** | Any modern version (2.x+) |

## Performance

- **NFR-PERF-1**: `deploy` of a 20-agent roster must complete in under 5 seconds on local disk.
- **NFR-PERF-2**: `status` must complete in under 3 seconds for a 50-file roster.
- **NFR-PERF-3**: `wipe` must complete in under 2 seconds.
- **NFR-PERF-4**: Extension activation must not add more than 500ms to VS Code startup time.
- **NFR-PERF-5**: MCP tool suggestions (v1.1) may take longer due to AI inference — show progress indicator. Timeout at 30 seconds per provider.

## Security

- **NFR-SEC-1**: API keys (Anthropic, Groq, OpenAI) must be stored in VS Code's secret storage (not in plaintext settings or manifest files).
- **NFR-SEC-2**: The manifest must never contain secrets, tokens, or credentials.
- **NFR-SEC-3**: File operations must NOT traverse outside the defined target directories (no path traversal via manifest manipulation).
- **NFR-SEC-4**: The install script must not run with elevated privileges unless explicitly needed and documented.
- **NFR-SEC-5**: AI suggestion prompts must not include file contents beyond agent descriptions and tool catalogs — no source code sent to external APIs.

## Reliability

- **NFR-REL-1**: All file operations must be atomic per-file — a failure mid-deploy must not leave the roster in a corrupted state (partial deploy is acceptable; half-written files are not).
- **NFR-REL-2**: If the manifest is invalid, no file operations are performed — fail fast and report.
- **NFR-REL-3**: Network-dependent features (MCP tool suggestions) must degrade gracefully — never block core lifecycle operations.
- **NFR-REL-4**: The extension must not crash VS Code. Unhandled errors must be caught at the command boundary and reported via notifications.

## Usability

- **NFR-USE-1**: All destructive operations (wipe, restore) require explicit user confirmation. No silent data loss.
- **NFR-USE-2**: Error messages must be actionable — include what failed, why, and what the user can do about it.
- **NFR-USE-3**: CLI output must be readable without color support (no information conveyed by color alone).
- **NFR-USE-4**: The extension must work immediately after install with a single configuration step (set repo path).

## Maintainability

- **NFR-MAINT-1**: Core logic (deploy, restore, wipe, status, manifest parsing) must be shared between extension and CLI — no duplication.
- **NFR-MAINT-2**: The manifest schema must be versioned. Breaking changes increment the major version.
- **NFR-MAINT-3**: Extension and CLI versions must be kept in sync (single version from `package.json`).

## Accessibility

- **NFR-A11Y-1**: VS Code extension commands must be fully operable via keyboard (inherent from command palette, but custom UI elements must also comply).
- **NFR-A11Y-2**: Any webview UI (if added for status display) must meet WCAG 2.1 AA contrast ratios.

## Data Integrity

- **NFR-DATA-1**: `deploy` must never modify files in the source repository — the repo is read-only during deploy.
- **NFR-DATA-2**: `restore` must never modify files in the source repository — it reads committed state and writes to target folders.
- **NFR-DATA-3**: Only `set-model`, `mcp add`, and `mcp remove` commands modify the manifest file.
