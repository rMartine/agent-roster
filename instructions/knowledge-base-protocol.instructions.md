---
description: "Use when: encountering errors, debugging failures, fixing bugs, reviewing code, starting new tasks in a domain with known pitfalls, post-mortem analysis, cataloging lessons learned"
---

# Knowledge Base Protocol

All agents participate in the knowledge loop. This prevents recurring mistakes across projects.

## On Error — All Agents

When you encounter an error, bug, or unexpected behavior:

1. **Check first** — Before debugging from scratch, ask `@knowledge-engineer` if this error pattern is already cataloged. Describe the error, the domain, and the stack involved.
2. **Apply known fix** — If a matching entry exists, follow the documented prevention/fix steps.
3. **Report new patterns** — After solving a novel error, report it to `@knowledge-engineer` for cataloging. Include: what happened, root cause, fix applied, and how to prevent it.

## On Solved Error — Knowledge Engineer

When an agent reports a solved error:

1. **Check for duplicates** — Search the knowledge base for existing entries matching this error pattern.
2. **Create or update** — If new, create a knowledge entry. If similar exists, update/integrate the new solution into the existing entry.
3. **Deduplicate** — Merge entries that describe the same root cause with different symptoms.

## Before Starting Work — All Agents

When beginning a task in any domain, check `project_docs/knowledge/` for locally cached knowledge entries relevant to the task. If the knowledge base container is available, query it for broader cross-project patterns.

## Local Cache

Each project maintains `project_docs/knowledge/` as a local cache of relevant knowledge base entries. This ensures knowledge is available even without the Docker-based knowledge repository running.
