# MCP Tool Management (v1.1)

## Overview

Agent Forge provides the ability to manage MCP (Model Context Protocol) tool assignments per agent. Users can manually add or remove MCP tools from agents, and optionally receive AI-powered suggestions for which tools best fit an agent's role based on available MCP servers.

## User Stories

### Story 14: View Available MCP Tools

**As a** power user
**I want** to see what MCP servers and tools are available in my environment
**So that** I know what tools I can assign to my agents

#### Acceptance Criteria

- [ ] Given MCP servers are configured in VS Code, when the user runs a "list tools" command, then all available MCP servers are listed with their tool catalogs
- [ ] Given an MCP server is configured but not running, then it is listed as "unavailable" with its last known tool catalog (if cached)
- [ ] Given no MCP servers are configured, then the output says "No MCP servers found"
- [ ] Given tool listing succeeds, then each tool shows: server name, tool name, tool description

#### Edge Cases

- MCP server takes too long to respond → timeout after configurable period, mark as unavailable
- MCP server returns malformed tool catalog → skip that server, report warning

---

### Story 15: Assign MCP Tools to Agents

**As a** power user
**I want** to add or remove MCP tool access for specific agents in the manifest
**So that** I can control which agents have access to which external tools

#### Acceptance Criteria

- [ ] Given an agent entry in the manifest, when the user adds an MCP tool, then the agent's `mcpTools` array in the manifest is updated
- [ ] Given an agent entry in the manifest, when the user removes an MCP tool, then the tool is removed from the agent's `mcpTools` array
- [ ] Given `deploy` runs with MCP tool assignments, then the deployed agent file is updated to reference the assigned MCP tools in its configuration
- [ ] Given MCP tools are assigned via CLI, then the command is: `agent-forge mcp add <agent-id> <server>/<tool>` and `agent-forge mcp remove <agent-id> <server>/<tool>`
- [ ] Given MCP tools are assigned via extension, then a quick pick UI lets the user select agent → select tool from available list

#### Manifest Extension

```jsonc
{
  "agents": [
    {
      "id": "backend-developer",
      "file": "agents/backend-developer.agent.md",
      "category": "engineering",
      "model": null,
      "toolset": "coding",
      "mcpTools": [
        "github/create_pull_request",
        "github/list_issues",
        "postgres/query"
      ]
    }
  ]
}
```

#### Edge Cases

- Tool reference uses a server that's not configured → warn but allow (tool may be configured on another machine)
- Duplicate tool added → silently deduplicate
- Agent file format doesn't support MCP tool references in its current schema → document the injection strategy

---

### Story 16: AI-Powered Tool Suggestions

**As a** power user
**I want** Agent Forge to suggest which MCP tools would be useful for each agent based on the agent's role
**So that** I discover relevant tools without manually reviewing every MCP server catalog

#### Acceptance Criteria

- [ ] Given an agent with a defined role/description and available MCP tools, when the user requests suggestions, then an AI model analyzes the agent's purpose and recommends tools with a brief rationale for each
- [ ] Given suggestions are generated, then each suggestion shows: tool name, server, why it fits, and an accept/reject action
- [ ] Given the user accepts a suggestion, then the tool is added to the agent's `mcpTools` in the manifest
- [ ] Given the user rejects a suggestion, then it is dismissed (no persistence of rejections in MVP)

#### AI Provider Waterfall

The suggestion engine uses the first available AI provider:

1. **Ollama Desktop (local)** — Preferred. Check if Ollama is running at `http://localhost:11434`. Use a capable model (e.g., `llama3`, `mistral`, or whatever is pulled locally). Zero cost, full privacy.
2. **Anthropic API** — Fallback. Requires API key in settings (`agentForge.ai.anthropicApiKey`).
3. **Groq API** — Fallback. Requires API key in settings (`agentForge.ai.groqApiKey`).
4. **OpenAI API** — Fallback. Requires API key in settings (`agentForge.ai.openaiApiKey`).
5. **No provider available** — Suggestions are silently disabled. Manual tool management still works. No error, no nagging.

#### Acceptance Criteria (Provider Waterfall)

- [ ] Given Ollama is running locally, then it is used for suggestions without any configuration
- [ ] Given Ollama is not running and an Anthropic key is configured, then Anthropic is used
- [ ] Given no Ollama and no API keys configured, then suggestions are disabled with a one-time info message: "AI suggestions unavailable. Configure an AI provider in settings for tool recommendations."
- [ ] Given the suggestion prompt, then it includes: agent name, agent description/role (from the agent file's description frontmatter), and the full list of available MCP tools with descriptions
- [ ] Given an API call fails (timeout, auth error), then the next provider in the waterfall is tried; if all fail, suggestions are disabled for that session

#### Edge Cases

- Ollama is running but has no models pulled → treat as unavailable, fall to next provider
- API key is present but invalid → report auth error, fall to next provider
- Agent file has no description → use the agent ID and filename as context (lower quality suggestions, but still functional)
- Very large tool catalog (100+ tools) → truncate or batch the prompt to fit context window limits

## Extension Settings (v1.1 additions)

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `agentForge.ai.provider` | enum | `"auto"` | AI provider: `"auto"` (waterfall), `"ollama"`, `"anthropic"`, `"groq"`, `"openai"`, `"none"` |
| `agentForge.ai.ollamaUrl` | string | `"http://localhost:11434"` | Ollama API endpoint |
| `agentForge.ai.ollamaModel` | string | `""` | Ollama model to use (empty = auto-select first available) |
| `agentForge.ai.anthropicApiKey` | string | `""` | Anthropic API key |
| `agentForge.ai.groqApiKey` | string | `""` | Groq API key |
| `agentForge.ai.openaiApiKey` | string | `""` | OpenAI API key |

## Open Questions

- **OQ-MCP-1**: How are MCP servers discovered? Does Agent Forge read VS Code's MCP configuration, or does the user define servers in the Agent Forge manifest/settings?
- **OQ-MCP-2**: How are MCP tools injected into deployed agent files? Current `.agent.md` files use YAML frontmatter with a `tools` array — do MCP tools go there, or in a separate `mcpServers` section?
- **OQ-MCP-3**: Should rejected suggestions be persisted so they are not re-suggested? If so, where?
- **OQ-MCP-4**: What Ollama model is "good enough" for tool suggestions? Should the extension auto-select or require the user to specify?
