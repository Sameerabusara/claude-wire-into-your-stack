# Claude Code Integration Notes

This document explains the four integrations wired into this Course API project.

## 1. MCP Server: `course-api-inspector`

**What it does:** Provides Claude with tools to inspect and work with the API project.

**Location:** `.mcp.json` (config) + `.claude/mcp/inspector.js` (implementation)

**Tools exposed:**
- `get_routes` — List all API routes (e.g., GET /health, GET /users)
- `get_scripts` — Show available npm scripts (test, lint)
- `run_script` — Execute npm scripts (test and lint only) with output capture

**Permission scoping (three deliberate choices):**

1. **Always-allow (read-only tools):** `["get_routes", "get_scripts"]` — These read data without side effects, so they execute immediately without prompts
2. **Confirmation-required (write tool):** `run_script` marked with `requiresConfirmation: true` — Executing scripts has side effects, so Claude must ask first
3. **Tool allowlist:** Only `test` and `lint` scripts can be executed (enforced in the MCP server's enum), preventing accidental `dev` or other commands

**Why this choice:** For a course API, having Claude understand the routes and be able to run scripts is essential. This server lets Claude:
- Discover what endpoints exist without reading code
- Verify changes by running tests (with confirmation)
- Check code style with lint (with confirmation)
- Operate with clear safety boundaries

**Scoping:** The server is configured at project scope in `.mcp.json`, making it available to the whole team with the same permission rules.

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

**Location:** `.claude/settings.json` under `hooks` array

**Three deliberate hook choices:**

1. **Event:** `PreToolUse` — Runs *before* the matched tool executes, allowing the hook to block unsafe commands
2. **Matcher:** `{ "tool": "Bash", "pattern": "git commit" }` — Intercepts attempts to run `git commit`
3. **Command:** `npm run lint` — Enforces linting before the commit is allowed

**Why this choice:**
- **PreToolUse** ensures linting happens *before* commit, so bad code never reaches git
- **Matcher pattern** is specific to git commits, not every Bash command
- Non-blocking but automatic (Claude can fix lint issues and retry)
- Lightweight (ESLint runs in milliseconds)
- Prevents commits with style violations and catches potential bugs early

**Permission scoping:** The hook has `allowedTools: ["Bash"]` so it can only run the linting command itself, preventing arbitrary shell execution.

**Alternative considered:** PostToolUse (runs after commit attempt) would catch violations too late; PreToolUse blocks them upfront.

## Running one task headless

**Example headless task with scoped tools:**

```bash
npm test
```

**Why this specific scoping:** The headless test task only needed `Bash` with the pattern `npm (run (test|lint)|test)` because:
- Tests require running `npm test`, nothing else
- Locks Claude to only npm commands (not arbitrary shell)
- Prevents accidental system changes
- Matches the `allowedTools: ["Bash"]` permission in the hook

This runs the test suite without interactive prompts, useful for CI/CD or batch operations. The headless run verified all 5 tests pass with no manual intervention needed.

## Summary

These integrations follow the principle: **"Set up Claude the way the project needs."**

- **MCP Server** gives Claude visibility and control (understand routes, run scripts)
- **Skill** documents how we test (structured, discoverable, team-aware)
- **Command** makes the common path fast (`/test` instead of "run npm test please")
- **Hook** enforces standards automatically (no bad commits slip through)

Together, they make Claude a natural part of the development workflow, not a tool you have to instruct each time.
