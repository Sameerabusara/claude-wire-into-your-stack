# Claude Code Integration Notes

This document explains the four integrations wired into this Course API project.

## 1. MCP Server: `course-api-inspector`

**What it does:** Provides Claude with tools to inspect and work with the API project.

**Location:** `.mcp.json` (config) + `.claude/mcp/inspector.js` (implementation)

**Tools exposed:**
- `get_routes` — List all API routes (e.g., GET /health, GET /users)
- `get_scripts` — Show available npm scripts (dev, test, lint)
- `run_script` — Execute npm scripts (test and lint) with output capture

**Why this choice:** For a course API, having Claude understand the routes and be able to run scripts is essential. This server lets Claude:
- Discover what endpoints exist without reading code
- Verify changes by running tests
- Check code style with lint
- Operate autonomously on common tasks

**Scoping:** The server is configured at project scope in `.mcp.json`, making it available to the whole team.

## 2. Skill: `run-tests`

**What it does:** Structured way to run tests with consistent formatting and output.

**Location:** `.claude/skills/run-tests/SKILL.md`

**When it fires:** On requests like "run tests", "test", "check tests"

**Why this choice:** Tests are critical for this API. By documenting test-running as a skill:
- Claude knows when testing is appropriate (before commits, when verifying changes)
- Output is consistently formatted
- The skill can be extended later with coverage reports or filtering
- New team members see "oh, there's a standard way we run tests"

**Implementation pattern:** Uses the MCP server's `run_script` tool to handle actual execution.

## 3. Custom Command: `/test`

**What it does:** Quick shortcut to run the test suite.

**Location:** `.claude/commands/test.md`

**Why this choice:** A one-keystroke shortcut for the most common operation. When working on the API:
- `npm test` is long; `/test` is fast
- Muscle memory: "I changed something → `/test` → verify it works"
- Obvious from the codebase: anyone seeing `/test` in Claude's responses knows what it means

**Relation to skill:** The `/test` command likely invokes the `run-tests` skill internally.

## 4. Hook: `before-commit` lint check

**What it enforces:** Code style is checked before every commit.

**Location:** `.claude/settings.json` under `hooks.before-commit`

**What it runs:** `npm run lint`

**Why this choice:** Linting is a hygiene standard for this project:
- Prevents commits with style violations
- Catches potential bugs early (ESLint rules)
- Non-blocking but automatic (Claude can fix lint issues and retry)
- Lightweight (ESLint runs in milliseconds)

**Permission rule:** The hook is scoped with `allowedTools: ["Bash"]` and a pattern matching only npm run commands, ensuring Claude can't abuse the hook to run arbitrary shell commands.

**Alternative considered:** Pre-push hook (catches before going upstream), but pre-commit is safer for learning — you discover issues locally, not after push.

## Running one task headless

Example headless task with scoped tools:

```bash
claude --allowedTools Bash --command "npm test"
```

This runs the test suite without interactive prompts, useful for CI/CD or batch operations.

## Summary

These integrations follow the principle: **"Set up Claude the way the project needs."**

- **MCP Server** gives Claude visibility and control (understand routes, run scripts)
- **Skill** documents how we test (structured, discoverable, team-aware)
- **Command** makes the common path fast (`/test` instead of "run npm test please")
- **Hook** enforces standards automatically (no bad commits slip through)

Together, they make Claude a natural part of the development workflow, not a tool you have to instruct each time.
