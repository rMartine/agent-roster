# Agent Forge

A VS Code extension + CLI that manages the lifecycle of a GitHub Copilot custom agent ecosystem. Agents, instructions, skills, toolset configs, prompts, and hooks are stored in a Git repo and deployed to their OS-specific target folders with a single command.

## Prerequisites

- **Node.js** 18+
- **VS Code** 1.85+
- **Git** (recommended; versioning features are skipped if unavailable)
- **Ollama** (recommended; required for image generation — [ollama.com](https://ollama.com))
- **Docker Desktop** (recommended; required for the knowledge base repository)

## Install

```powershell
git clone <your-repo-url> agent-forge
cd agent-forge
.\scripts\install.ps1
```

The install script builds all packages, packages the extension as a VSIX, installs it into VS Code, and links the CLI globally.

## CLI Usage

All commands accept `--repo <path>` (defaults to cwd) and `-y` to skip confirmation prompts.

```
agent-forge deploy      # Deploy roster files to target OS folders
agent-forge restore     # Overwrite local files with repo state
agent-forge wipe        # Delete all managed files from target folders
agent-forge status      # Show sync status (repo vs. local)
```

## VS Code Extension

Open the Command Palette and search for **Agent Forge**:

| Command | Description |
|---------|-------------|
| Agent Forge: Deploy | Deploy roster to target folders |
| Agent Forge: Restore | Restore local files from repo |
| Agent Forge: Wipe | Remove all managed files |
| Agent Forge: Status | Show sync status |
| Agent Forge: Set Repository Path | Configure the roster repo location |
| Agent Forge: Enable Sub-Agent Nesting | Allow agents to invoke other agents |

## Documentation

See [`project_docs/`](project_docs/) for detailed requirements, architecture, and knowledge base.
