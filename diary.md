# Practical Exam - Development Diary

We split the requirements by area and committed each requirement separately on `master`.

**Team members:**

**Repository:** https://github.com/ThePaulo1/backpack-brawl

**Not implemented:** None

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

### Decision 3: Unique ID per opponent search

- **Decision:** A response only starts a battle if its search ID matches the running search so late or duplicate responses never start or restart a battle.
- **Alternatives Considered:** Checking only the round (fails when a new run starts during a search), cancelling requests (answers that already arrived still apply).
- **Trade-offs:** Requires clearing the active ID on resets or new runs and old requests still finish in the background before being ignored.

## 3. Team Conventions

- **UI:** No new design system; we reuse the existing Tailwind styles, badges and tooltips or apply the same visual language
- **Commits:** `type(scope): imperative description`, lowercase, under about 72 characters, scope `b1`–`b7`. Types: `feat`, `fix`, `refactor`, `docs`, `chore`.

  Example: `feat(b1): add item selling and shop reroll; block buying when full`

## 4. Work Organization

We divided the requirements by functional area and shared file ownership to minimize merge conflicts:

- **Person 1 — Core Battle & Item Systems (`B2`, `B3`, `B4`)**
- **Person 2 — Economy, Resilience, Persistence & Leaderboard (`B1`, `B5`, `B6`, `B7`)**
- **Coordination Points:** Both members aligned early on shared TypeScript types (`src/types.ts`), the team conventions and UI guidelines

## 5. AI Usage

We used coding agents as a tool to work faster, for example to write code and documentation for the requirements we planned. We reviewed every change by hand, tested it in the game and adapted it where needed. Rules, trade-offs and design decisions were made by us

## 6. Final Reflection & Lessons Learned

- **Teamwork:** Splitting the requirements by area worked well: we didn't change the same files at once and one commit per requirement kept the history easy to follow.
- **Hardest part:** Not the game rules but the edge cases: slow or late API responses (B5) and save data that can be broken or edited (B6). The interface alone cannot protect the game; every rule also has to protect itself.
- **What paid off:** Keeping the rules in pure TypeScript functions. Selling, saving and the hall of fame could reuse the same checks, and the code stayed easy to explain.
- **AI:** The coding agent made us faster but only because we reviewed and tested every change. Its suggestions sometimes went beyond the requirements, so we kept the scope small on purpose.
- **Next time:** We would add a few automated tests for the core rules early on. Checking edge cases by hand took more time and is easy to forget after later changes.
