# Build & Install

## Overview

Agent Forge is distributed as a sideloaded VS Code extension (VSIX) and a CLI tool. It is never published to the VS Code Marketplace. The repository includes a build-and-install script that performs the full setup in a single command.

## User Stories

### Story 5: Build and Install from Source

**As a** power user
**I want** to run a single script that builds and installs both the VS Code extension and CLI tool
**So that** I can set up Agent Forge on any machine from the repository alone

#### Acceptance Criteria

- [ ] Given the repo is cloned and Node.js is installed, when the user runs `install.ps1`, then the VS Code extension is built into a `.vsix` file
- [ ] Given the `.vsix` is built, when `install.ps1` continues, then the extension is installed into VS Code via `code --install-extension`
- [ ] Given the extension is installed, when `install.ps1` continues, then the CLI tool is built and placed in a directory on the user's PATH
- [ ] Given all steps succeed, then a summary is shown: extension version installed, CLI version installed, CLI location
- [ ] Given VS Code is not found in PATH, then the script reports a clear error and skips extension installation (CLI can still be installed)
- [ ] Given Node.js is not installed, then the script reports a clear error and exits before attempting any build
- [ ] Given the extension is already installed (same version), then the script overwrites it with the freshly built version (reinstall)
- [ ] Given the extension is already installed (older version), then the script upgrades it in place

#### Edge Cases

- Multiple VS Code installations (Stable, Insiders) → install into the default `code` command; document how to target Insiders
- User does not have write permissions to the CLI install directory → report error, suggest running as administrator or choosing a different path
- Build fails due to missing npm dependencies → script runs `npm install` automatically before building

---

### Story 6: Uninstall

**As a** power user
**I want** to uninstall the extension and CLI cleanly
**So that** I can remove Agent Forge without leftover artifacts

#### Acceptance Criteria

- [ ] Given the extension is installed, when the user runs `uninstall.ps1`, then the extension is removed via `code --uninstall-extension`
- [ ] Given the CLI is on PATH, when `uninstall.ps1` continues, then the CLI binary is deleted
- [ ] Given uninstall completes, then a summary is shown confirming what was removed
- [ ] Given the extension is not installed, then the script reports "Extension not found" and continues to CLI removal

#### Edge Cases

- CLI is in use by another terminal session → report that the file is locked, suggest closing terminals

---

## Script Requirements

| Script | Platform | Purpose |
|--------|----------|---------|
| `install.ps1` | Windows (PowerShell) | Build + install extension + CLI |
| `uninstall.ps1` | Windows (PowerShell) | Remove extension + CLI |

Future: `install.sh` and `uninstall.sh` for macOS/Linux (deferred, not in MVP).

## Prerequisites (checked by scripts)

1. Node.js (>= 18.x)
2. npm
3. VS Code (`code` command in PATH) — optional for CLI-only install
4. Git (repo must be cloned)

## Open Questions

- **OQ-INSTALL-1**: Where should the CLI binary be installed on Windows? Options: `%USERPROFILE%\.agent-forge\bin` (added to PATH by the script), or a user-specified location.
- **OQ-INSTALL-2**: Should the install script also run `deploy` automatically after install, so the user's roster is immediately active?
