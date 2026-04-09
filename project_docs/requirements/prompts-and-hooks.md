# Prompts and Hooks Support

## Overview

Agent Forge currently manages four artifact types: agents, instructions, skills, and toolset configs. This feature extends the roster to include two additional artifact types — **prompts** and **hooks** — so that all user-authored Copilot customization files are managed through a single lifecycle.

**Prompts** (`*.prompt.md`) are reusable slash commands for Copilot Chat, invoked via `/command-name`. They are Markdown files with optional YAML frontmatter (`description`, `name`, `agent`, `model`, `tools`) and deploy to the same `targets.prompts` location as agents and instructions.

**Hooks** (`*.json`) are JSON configuration files that run shell commands at agent lifecycle events (`PreToolUse`, `PostToolUse`, `SessionStart`, `Stop`, etc.). They deploy to a new target location at `%USERPROFILE%/.copilot/hooks/`.

Adding these types requires manifest schema additions and ensures all four lifecycle operations (deploy, restore, wipe, status) handle them seamlessly without new commands.

## User Stories

### Story 17: Manage Prompts in Roster

**As a** power user
**I want** to include prompt files in my roster manifest and have them deployed, restored, wiped, and tracked alongside my existing agents and instructions
**So that** my reusable slash commands are version-controlled and lifecycle-managed like every other artifact in my ecosystem

#### Acceptance Criteria

- [ ] Given the manifest contains a `prompts` array, when validation runs, then each prompt entry is validated for required fields (`id`, `file`)
- [ ] Given a prompt entry with `"file": "prompts/my-command.prompt.md"`, when `deploy` runs, then the file is copied to the `targets.prompts` path (same target as agents and instructions)
- [ ] Given a prompt file already exists locally with identical content, when `deploy` runs, then that file is skipped (no unnecessary write)
- [ ] Given a prompt file exists locally with different content, when `deploy` runs, then the local file is overwritten with the repo version
- [ ] Given locally modified prompt files, when `restore` runs, then prompt files are overwritten with the repo's committed versions, same as agents and instructions
- [ ] Given managed prompt files exist locally, when `wipe` runs, then prompt files listed in the manifest are deleted from the target folder
- [ ] Given prompt files are deployed, when `status` runs, then prompts are listed under a separate "Prompts" group in the output (distinct from agents and instructions)
- [ ] Given `status` runs, then each prompt shows its sync state: in-sync, modified, missing locally, missing from repo, or untracked
- [ ] Given a prompt file has YAML frontmatter, when `deploy` runs, then the file is copied verbatim — Agent Forge does not parse or modify frontmatter for prompts

#### Edge Cases

- Prompt file has the same filename as an agent or instruction file → deploy proceeds (they coexist in the same target folder); manifest validation warns about potential filename collisions across types
- Prompt file has no YAML frontmatter → valid; deploy it as-is
- Prompt file references an agent name in frontmatter that is not in the manifest → no validation; Agent Forge manages files, not Copilot runtime config
- `prompts` array is empty → no prompts to manage, no warning needed

---

### Story 18: Manage Hooks in Roster

**As a** power user
**I want** to include hook configuration files in my roster manifest with their own deployment target
**So that** my Copilot lifecycle hooks are version-controlled and deployed alongside my agents, prompts, and other artifacts

#### Acceptance Criteria

- [ ] Given the manifest defines `"targets.hooks": "%USERPROFILE%/.copilot/hooks"`, when any operation resolves target paths, then the hooks target is resolved correctly with environment variable expansion
- [ ] Given the manifest contains a `hooks` array, when validation runs, then each hook entry is validated for required fields (`id`, `file`)
- [ ] Given a hook entry with `"file": "hooks/pre-tool-use.json"`, when `deploy` runs, then the file is copied to the `targets.hooks` path
- [ ] Given the `targets.hooks` directory does not exist, when `deploy` runs, then the directory is created before copying hook files
- [ ] Given a hook file already exists locally with identical content, when `deploy` runs, then that file is skipped (no unnecessary write)
- [ ] Given a hook file exists locally with different content, when `deploy` runs, then the local file is overwritten with the repo version
- [ ] Given locally modified hook files, when `restore` runs, then hook files are overwritten with the repo's committed versions
- [ ] Given managed hook files exist locally, when `wipe` runs, then hook files listed in the manifest are deleted from the `targets.hooks` folder
- [ ] Given wipe deletes all hook files and the `targets.hooks` folder becomes empty, then the empty folder is left in place (do not delete OS-level config directories)
- [ ] Given hook files are deployed, when `status` runs, then hooks are listed under a separate "Hooks" group in the output
- [ ] Given `status` runs, then each hook shows its sync state: in-sync, modified, missing locally, missing from repo, or untracked
- [ ] Given a hook JSON file contains valid JSON, when `deploy` runs, then the file is copied verbatim — Agent Forge does not validate hook schema or event names
- [ ] Given the wipe confirmation prompt, then hook file counts are included in the summary (e.g., "N agent files, M instruction files, P prompt files, H hook files")

#### Edge Cases

- `targets.hooks` is not defined in the manifest but `hooks` array is present → validation error: "hooks entries require targets.hooks to be defined"
- Hook file is not valid JSON → Agent Forge deploys it as-is (file manager, not a JSON validator); no validation error
- Hook file references a shell command that doesn't exist on the system → not Agent Forge's concern; it manages files, not runtime behavior
- `hooks` array is empty → no hooks to manage, no warning needed
- User's `%USERPROFILE%/.copilot/` directory does not exist → create the full path (`hooks/` and its parents) on deploy

---

## Manifest Schema Additions

The following additions are needed to the existing manifest schema defined in [roster-manifest.md](roster-manifest.md):

### New target path

```jsonc
"targets": {
  "prompts": "%APPDATA%/Code/User/prompts",       // existing
  "skills": "%USERPROFILE%/.copilot/skills",       // existing
  "hooks": "%USERPROFILE%/.copilot/hooks"           // NEW
}
```

### New `prompts` array

```jsonc
// Prompt definitions (reusable slash commands)
"prompts": [
  {
    "id": "my-slash-command",           // unique string
    "file": "prompts/my-slash-command.prompt.md"  // path relative to repo root
  }
]
```

### New `hooks` array

```jsonc
// Hook definitions (lifecycle event configs)
"hooks": [
  {
    "id": "pre-tool-use",              // unique string
    "file": "hooks/pre-tool-use.json"  // path relative to repo root
  }
]
```

### Complete manifest example (showing only new sections)

```jsonc
{
  "version": "1.0",
  "editor": "vscode",

  "targets": {
    "prompts": "%APPDATA%/Code/User/prompts",
    "skills": "%USERPROFILE%/.copilot/skills",
    "hooks": "%USERPROFILE%/.copilot/hooks"         // NEW
  },

  // ... existing agents, instructions, skills, toolsets ...

  // NEW — Prompts
  "prompts": [
    { "id": "generate-tests", "file": "prompts/generate-tests.prompt.md" },
    { "id": "review-pr",      "file": "prompts/review-pr.prompt.md" }
  ],

  // NEW — Hooks
  "hooks": [
    { "id": "pre-tool-use",   "file": "hooks/pre-tool-use.json" },
    { "id": "session-start",  "file": "hooks/session-start.json" }
  ]
}
```

## Non-Functional Requirements

- **Performance**: Adding prompts and hooks should not measurably increase deploy/restore/wipe time for a roster with fewer than 50 total artifacts. File I/O is the same copy/delete pattern as existing types.
- **Backward Compatibility**: A manifest without `prompts` or `hooks` arrays is still valid. These sections are optional. Existing manifests continue to work without changes.
- **Status Output**: The status command output grouping order should be: Agents, Instructions, Prompts, Skills, Toolsets, Hooks. Prompts are grouped near agents/instructions (same target folder); hooks are listed last (separate target).

## Impact on Existing Requirements

| Existing Requirement | Impact |
|---|---|
| [core-lifecycle.md](core-lifecycle.md) Stories 1–4 | All four operations now handle `prompts` and `hooks` arrays in addition to existing types. No new commands needed. |
| [roster-manifest.md](roster-manifest.md) Story 10 | Manifest schema gains `targets.hooks`, `prompts[]`, and `hooks[]`. Validation (Story 11) must cover the new entry types. |
| [roster-manifest.md](roster-manifest.md) Story 11 | Validation must check new arrays for `id`/`file`, check for cross-type ID uniqueness, and require `targets.hooks` when `hooks[]` is present. |
| [product-overview.md](product-overview.md) Artifact table | Add two new rows: Prompt (`*.prompt.md`, prompts target) and Hook (`*.json`, hooks target). |

## Open Questions

- **OQ-PH-1**: Should prompt IDs be globally unique across all artifact types (agents, instructions, prompts, hooks), or only unique within their own type array?
- **OQ-PH-2**: Should `status` detect untracked `*.prompt.md` files in the prompts target folder the same way it detects untracked agents? This requires scanning the target directory for prompt-pattern files not in the manifest.
- **OQ-PH-3**: Hooks support nested subdirectories in `%USERPROFILE%/.copilot/hooks/` (e.g., `hooks/pre-tool-use/my-hook.json`). Should the manifest `file` field support subdirectory paths, and should deploy preserve the directory structure?
- **OQ-PH-4**: Should the wipe confirmation prompt distinguish between artifact types (e.g., "5 agents, 3 instructions, 2 prompts, 1 hook") or just show a total count?

## Dependencies

- Existing lifecycle operations (deploy, restore, wipe, status) in `packages/core/`
- Manifest parser and validator in `packages/core/src/manifest.ts`
- Target path resolution in `packages/core/src/paths.ts`
- CLI and extension commands surface results — must handle new type groups in output formatting
