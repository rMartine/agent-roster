---
name: scaffold-project
description: "Scaffold a new project with mono-repo structure, Docker Compose, run-dev scripts, project_docs folders, and environment configs. Use when starting a new project, initializing a repo, or setting up local development."
argument-hint: "Describe the project (e.g., 'SaaS app with Next.js frontend and Node.js API')"
---

# Scaffold Project

Creates a complete project skeleton following the team's conventions.

## When to Use

- Starting a new product or application
- Initializing a fresh repository
- Setting up local development infrastructure

## Procedure

1. **Gather requirements** — Ask the user for: project name, apps needed (web, api, mobile, desktop), and any special services.

2. **Create the mono-repo structure**:

```
{project-name}/
├── apps/
│   └── {app-name}/           # One per deployable app
│       ├── Dockerfile
│       ├── src/
│       └── package.json (or equivalent)
├── packages/                  # Shared libraries
├── scripts/
├── project_docs/
│   ├── requirements/
│   ├── architecture/
│   ├── backlog/
│   ├── knowledge/
│   └── docs/
├── docker-compose.yml
├── run-dev.sh
├── run-dev.ps1
├── .env.example
├── .gitignore
└── README.md
```

3. **Create docker-compose.yml** with services:
   - PostgreSQL 16 with PostGIS and PGVector extensions
   - Redis (if queues or caching needed)
   - Ollama (if AI features needed)
   - Named volumes for all persistent data

4. **Create run-dev scripts** (both `.sh` and `.ps1`):
   - Start Docker Compose services
   - Wait for DB readiness
   - Run migrations if applicable
   - Start dev servers for each app

5. **Create .env.example** with all required environment variables (placeholder values only).

6. **Create .gitignore** covering: node_modules, .env, dist, build, .next, __pycache__, *.pyc, data/, models/.

7. **Create README.md** with:
   - Project one-liner
   - Prerequisites (Docker, Node.js, etc.)
   - Quick start via `run-dev`
   - Project structure overview
   - Link to `project_docs/` for detailed docs

8. **Initialize project_docs/** with placeholder README in each subdirectory explaining its purpose.

## Tech Stack Defaults

- **Web apps**: TypeScript, Next.js (App Router), React, Tailwind CSS
- **API apps**: TypeScript, Node.js
- **Database**: PostgreSQL 16 + PostGIS + PGVector (always)
- **ORM**: Drizzle ORM
- **Containers**: Docker Compose for local dev
- **Cloud target**: DigitalOcean (configs prepared but never deployed by agents)
