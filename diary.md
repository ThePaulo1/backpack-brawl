# Practical Exam - Development Diary

Team members:
Repository:

## 1. Qualitative Goals

To match the scope of a browser-based single-player game and keep the codebase easy to maintain and defend within a small team, we prioritized three qualitative goals:

1. **Simplicity & Avoiding Overengineering**
   - **Why it matters:** Unnecessary abstractions, external state managers, or heavy UI libraries slow down development and introduce avoidable bugs.
   - **Approach:** Build directly on the starter's lightweight stack without adding third-party frameworks.

2. **React Best Practices & Separation of Concerns**
   - **Why it matters:** Mixing game simulation or validation rules into JSX components leads to duplicated logic, stale state bugs, and hard-to-test UI code.
   - **Approach:** Keep all game rules, action guards, and battle ticks in pure TypeScript functions, using React components strictly for rendering state and dispatching actions.

3. **Simple & Minimal Code**
   - **Why it matters:** Agentic coding tools often add unnecessary abstractions and boilerplate. Keeping the code simple reduces bugs and makes reviews faster.
   - **Approach:** Build only what `REQUIREMENTS.md` (`B1`–`B7`) asks for, using straightforward code and trimming overcomplicated AI-generated suggestions.

## 2. Significant Architectural Decisions

### Decision 1: Client-Side Run Persistence via `localStorage` with Schema Validation (B6)

- **Decision:** Persist the serialized run state in `localStorage`. On app startup, parse and validate all fields and game invariants before restoring; fall back cleanly to a fresh playable state if data is malformed or impossible.
- **Refresh Policy:**
  - Refreshing during `searching` resets to `shop` without advancing the RNG seed (no free rerolls).
  - Refreshing during `battle` restores the already-determined opponent and battle outcome so a loss cannot be dodged.
- **Alternatives Considered:** `sessionStorage` (loses progress if the tab is accidentally closed) and server-side sessions (overengineered for an in-memory local API).
- **Trade-offs:** `localStorage` can be manually edited in DevTools and is shared across tabs, which requires explicit runtime schema validation on load instead of trusting stored JSON blindly.

### Decision 2: Single Source of Truth for Shared TypeScript Types Across Frontend & API

- **Decision:** Define shared domain and API contract types once in a shared TypeScript module referenced by both the Vite frontend and the Express backend.
- **Alternatives Considered:** Maintaining separate type definitions which risks silent contract drift when extending types.
- **Trade-offs:** Requires running/type-checking the server with TypeScript support, and compile-time types do not protect against invalid runtime HTTP requests so the Express server still performs explicit runtime validation on eg `POST /api/hall-of-fame`.

### Decision 3: TBD

## 3. Team Conventions & UI Guidelines

### UI & Design Consistency

- **No New Design System:** Build strictly on top of the existing Tailwind CSS styling and component patterns.
- **Consistent Patterns:** Display new status effects alongside HP/block using the same visual language, show set memberships via compact badges on existing item cards, and explain every new rule in `RulesPanel` and hover tooltips.

### Git Commit Convention

Format: `<type>(<scope>): <imperative description>`

- Lowercase, imperative mood (`add`, `fix`, `update` — not `added` or `adds`)
- Under ~72 characters
- Use `b1`–`b7` as the scope for exam requirements, or a component/tool name for setup

| Type       | When to use it                                           | Example                                                            |
| :--------- | :------------------------------------------------------- | :----------------------------------------------------------------- |
| `feat`     | New game mechanic, UI feature, or API endpoint           | `feat(b1): allow selling backpack items for half price`            |
| `fix`      | Bug fix in logic, state transitions, or UI               | `fix(b5): ignore late opponent responses after cancel`             |
| `test`     | Adding or updating Vitest unit tests (`*.test.ts`)       | `test(b3): add poison stacking and heal cap tests`                 |
| `refactor` | Restructuring code without changing behavior             | `refactor(battle): extract status effect tick processor`           |
| `docs`     | Documentation updates (`docs/API.md`, qualitative notes) | `docs(b7): document hall of fame endpoints in API.md`              |
| `chore`    | Tooling, config, dependencies, or dev environment        | `chore(devcontainer): add devcontainer setup and expose vite host` |


## 4. Work Organization

We divided the requirements by functional area and shared file ownership to minimize merge conflicts:

- **Person 1 — Core Battle & Item Systems (`B2`, `B3`, `B4`)**
- **Person 2 — Economy, Resilience, Persistence & Leaderboard (`B1`, `B5`, `B6`, `B7`)**
- **Coordination Points:** Both members aligned early on shared TypeScript types (`src/types.ts`), the team conventions and UI guidelines

## 5. AI Usage

We used agentic coding tools as a development accelerator while retaining full human ownership over architecture, game-balance constants and design decisions. Specifically AI assistance was used to:

- Scaffold boilerplate code and TypeScript interfaces faster.
- Review React components and state transitions for adherence to React best practices and edge-case handling.
- Cross-check requirements coverage and documentation consistency.

All generated code was manually reviewed, tested, and adapted to fit our qualitative goals and existing project structure.

## 6. Final Reflection & Lessons Learned

TBD