# Repo Folder Setup

## Overview

Agent Forge currently assumes the roster repo is the workspace root. There is no user-configurable repo path setting, and Forge does not scaffold the expected folder structure for new users. This feature introduces a `agentForge.repoPath` setting that persists at the user level, a first-activation prompt to configure it, folder structure scaffolding for empty or new repos, and validation that catches misconfigured paths before any lifecycle operation runs.

## User Stories

### Story 19: Repo Path Configuration and Folder Scaffolding

**As a** power user setting up Agent Forge for the first time (or on a new machine)
**I want** to configure where my roster repo lives and have Forge create the required folder structure if it's missing
**So that** I can get started without manually creating directories or remembering the expected layout

#### Acceptance Criteria

**Repo path setting**

- [ ] Given the extension is installed, then a VS Code setting `agentForge.repoPath` (string) is available in user-level settings, described as "Absolute path to the local folder containing (or that will contain) the Agent Forge roster repository"
- [ ] Given `agentForge.repoPath` is not set and the extension activates for the first time, when activation completes, then the user is prompted with a notification: "Agent Forge: Select the folder for your roster repository" with two buttons: "Browse…" (opens a native folder picker dialog) and "Use Workspace Root" (sets the value to the current workspace root)
- [ ] Given the user clicks "Browse…", when they select a folder, then `agentForge.repoPath` is written to user-level VS Code settings (global, not workspace-scoped)
- [ ] Given the user clicks "Use Workspace Root", then the current workspace root path is written to `agentForge.repoPath` in user-level VS Code settings
- [ ] Given the user dismisses the notification without choosing, then `agentForge.repoPath` remains unset and the prompt reappears on the next activation
- [ ] Given `agentForge.repoPath` is already set to a valid path, when the extension activates, then no prompt is shown
- [ ] Given the user changes `agentForge.repoPath` via VS Code settings UI or `settings.json`, then the new value takes effect immediately without requiring a VS Code reload

**Folder structure scaffolding**

- [ ] Given `agentForge.repoPath` points to an existing folder that is empty or missing any of the expected directories, when the user runs any lifecycle command (deploy, restore, wipe, status) OR when the path is first configured, then Forge creates the missing directories: `agents/`, `instructions/`, `skills/`, `config/`, `hooks/`, `prompts/`, `scripts/`, `project_docs/`, `project_docs/requirements/`, `project_docs/architecture/`, `project_docs/backlog/`, `project_docs/knowledge/`
- [ ] Given `agentForge.repoPath` points to a folder that does not contain `agent-forge.manifest.jsonc`, when scaffolding runs, then Forge generates a starter manifest with: `"version": "1.0"`, `"editor": "vscode"`, `"targets"` with the default Windows paths (`%APPDATA%/Code/User/prompts`, `%USERPROFILE%/.copilot/skills`, `%USERPROFILE%/.copilot/hooks`), and empty arrays for `agents`, `instructions`, `skills`, `prompts`, `hooks`, and an empty `toolsets` object
- [ ] Given the configured folder already contains some directories or files, when scaffolding runs, then only missing directories and the manifest (if absent) are created — existing files and folders are never overwritten or modified
- [ ] Given scaffolding creates directories or a manifest, then a VS Code information notification summarizes what was created (e.g., "Agent Forge: Created 8 directories and starter manifest in {path}")
- [ ] Given the configured folder already has the complete structure and manifest, when scaffolding runs, then no changes are made and no notification is shown

**Validation on lifecycle commands**

- [ ] Given `agentForge.repoPath` is not set, when the user runs any lifecycle command (deploy, restore, wipe, status), then the command is aborted and an error notification is shown: "Agent Forge: Roster repo path is not configured" with a button "Configure…" that opens the folder picker dialog
- [ ] Given `agentForge.repoPath` points to a path that does not exist on disk, when the user runs any lifecycle command, then the command is aborted and an error notification is shown: "Agent Forge: Repo path does not exist: {path}" with a button "Change…" that opens the folder picker dialog
- [ ] Given `agentForge.repoPath` points to a file (not a directory), when the user runs any lifecycle command, then the command is aborted and an error notification is shown: "Agent Forge: Repo path is not a directory: {path}" with a button "Change…" that opens the folder picker dialog
- [ ] Given the user clicks the "Configure…" or "Change…" button on any validation error, when they select a new folder, then `agentForge.repoPath` is updated and the originally requested command is NOT automatically re-run (user must invoke it again)
- [ ] Given the CLI is used with `--repo <path>`, then the CLI flag value overrides `agentForge.repoPath` for that invocation only; validation rules apply identically to the provided path

#### Edge Cases

- Repo path contains spaces or special characters (e.g., `C:\Users\John Doe\My Roster`) → path is handled correctly without escaping issues
- Repo path uses forward slashes on Windows (e.g., `C:/Users/me/roster`) → normalized to OS-appropriate separators before use
- Repo path uses environment variables (e.g., `%USERPROFILE%\agent-roster`) → expanded before validation and use
- Folder exists but user lacks write permissions → scaffolding reports a clear error: "Cannot create directories in {path}: permission denied"
- Configured folder is on a network drive or removable media that becomes unavailable → validation catches "path does not exist" at command time
- User changes `agentForge.repoPath` while a lifecycle command is in progress → in-flight command uses the path it started with; the new value applies to subsequent commands
- Multiple VS Code windows open → all windows share the same user-level setting; changing it in one window updates all windows
- Extension activates with no workspace open (e.g., VS Code opened without a folder) → the "Use Workspace Root" button is hidden; only "Browse…" is available

## Non-Functional Requirements

- **Performance**: Scaffolding (creating directories + manifest) must complete in under 1 second on local disk.
- **Security**: The repo path setting must not allow path traversal outside the specified directory. Scaffold operations must not write files outside `agentForge.repoPath`.
- **Accessibility**: The folder picker dialog is native OS UI (inherits OS accessibility). Notification buttons must be keyboard-navigable.

## Open Questions

- **OQ-SETUP-1**: Should scaffolding also generate a `.gitignore` file in the repo folder (e.g., ignoring `node_modules/`, build artifacts)?
- **OQ-SETUP-2**: Should the starter manifest include placeholder agent entries with comments, or be empty arrays only?
- **OQ-SETUP-3**: Should scaffolding offer to run `git init` if the folder is not already a Git repository?

## Dependencies

- [extension-and-cli.md](extension-and-cli.md) Story 9 — This story supersedes the minimal `agentForge.repoPath` definition in Story 9. Story 9's acceptance criteria for the setting should reference this story for the full behavior specification.
- [core-lifecycle.md](core-lifecycle.md) Stories 1–4 — All lifecycle operations must call repo path validation before executing.
- [roster-manifest.md](roster-manifest.md) Story 10 — The starter manifest generated by scaffolding must conform to the schema defined in Story 10.
