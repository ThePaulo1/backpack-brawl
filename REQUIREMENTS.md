# Backpack Brawl Requirements

## B1 — Shop economy (10%)

As a player, I want to sell items from my backpack for half their price (rounded down) and to reroll the shop offers for 1 🪙.

Gold never becomes negative, an item I pay for always ends up in my backpack, and an item is never lost or duplicated by buying or selling. Every action either completes fully or changes nothing. When an action is not possible, the interface tells me why before I try it, and the same rule also protects the action itself. Shop and backpack actions are only possible while I am shopping.

>- Added atomic `sellItem` and `rerollShop` run logic; every action is protected by a blocker function, which the interface also uses to explain unavailable purchases and rerolls.
>- Buying is now blocked while the backpack is full, so a paid item can no longer be lost.
>- Items are sold through the existing backpack selection; a reroll replaces all offers, including sold ones, and advances the run's seed.

## B2 — Backpack arrangement (15%)

As a player, I want to arrange my backpack. I can select an item, see that it is selected, and move it to another slot. Moving onto an occupied slot swaps the two items. The interface shows which moves are possible, and I can cancel a selection.

>- Added atomic `moveBackpackItem` and swap run logic for valid backpack slots.
>- Updated the backpack UI to highlight a selected item, enable valid destination slots, show swap/move guidance, and provide a cancel-selection action.

## B3 — Status effects (15%)

As a player, I want two new effects in battle:

- **Poison** adds stacks to the enemy. A poisoned fighter regularly loses HP for every stack. Poison stacks up and ignores block.
- **Heal** restores the fighter's own HP, but never above their max HP.

The catalog contains **at least 3 items per effect**, new or existing items changed, and the shop offers them. Opponents may use them. Poison and heal are shown in the battle view (for example a poison counter per fighter), in the combat log and in the rules panel and tooltips. Your team chooses the exact tick interval and values. They must be deterministic and explained in the interface.

>- Added three poison and three healing items to the catalog, automatically available in the shop and equipped by later opponents.
>- Poison stacks add 1 HP damage per stack every 2 battle ticks, ignoring block; stacks persist, and newly applied stacks count on an immediately due pulse. Healing restores HP on item fire up to max HP.
>- Added poison counters, effect tooltips, combat-log events and rules-panel explanations.

## B4 — Item sets (20%)

As a player, I want items to belong to sets that reward collecting them. There are **at least 2 sets**, one of them **Fire**. Each set has **at least 3 items**. Sets may reuse existing items. Each set grants a bonus while **2 or more** of its items are in a backpack. Bonuses apply to the player and to opponents alike. Set badges are shown on items in the shop and in battle, and active bonuses are visible.

The Fire set adds a new status, **Burn**, a damage-over-time effect that is clearly different from poison:

- it **stacks faster** and **deals more damage** than poison,
- it **does not ignore block**: block absorbs burn damage first,
- it **decays** over time until it wears off.

Your team chooses the exact tick, stack, damage and decay values. They must be deterministic and explained in the rules panel. Burn is shown in the battle view and the combat log.

B3 and B4 do not depend on each other. If B3 is not built, Burn is the first status effect, and the other set bonuses can boost damage or block instead.

>- Added the Fire set (Ember Sword, Cinder Bomb, Flame Brazier) and Guardian set (Oak Buckler, Pot Lid, Spiked Shield); two or more instances activate a set bonus, and duplicate copies count.
>- Fire items add Burn, which ticks every 0.5 s for 2 damage per stack, is absorbed by block first, and decays by 1 stack each tick. New stacks start ticking on the following tick. The Fire bonus reduces those items' cooldown by 1 tick; Guardian grants 2 starting block.
>- Added set badges in the shop and battle, active bonus summaries for both fighters and the player's backpack, and added set items to opponent loadouts.
>- Documented the set and Burn decisions in the rules panel and README

## B5 — Resilient matchmaking (10%)

As a player, I want looking for an opponent to be reliable. While a search is running I see that it is running, and I cannot start a second one. A failed or unavailable API returns me to a usable shop with an understandable message and lets me try again.

A battle is only ever started for the current round and the current search. A slow, duplicate or late response must never restart a battle, start a battle outside a search, or apply a result twice.

>- Every search has a unique `searchId`; responses from any other search, or outside the searching phase, are ignored.
>- A search can only start from the shop; its button is disabled while searching.
>- Failures, unreachable APIs, timeouts (10 s) and opponents for a wrong round return to the shop with a message and allow a retry.

## B6 — Save and resume (10%)

As a player, I want to refresh the browser and continue my run where I left it, on the matching screen. Your team decides which state is meaningful for continuing a run and stores it in the browser.

Saved data that is malformed, incompatible or describes an impossible run must not break the game; the game falls back to a playable state. Your team defines and communicates a policy for a refresh during a search or a battle replay. Refreshing must not become a way to get a free reroll, a different opponent, a second result, or to avoid a loss.

>- Run, phase, opponent and replay frame are stored in `localStorage` on every change and validated on load; malformed, incompatible or impossible saves are ignored.
>- Refreshing during a search returns to the shop with unchanged offers and seed. Refreshing during a battle simulates the same battle again and continues at the saved frame, so the result stays the same and is applied once.
>- The start page offers to continue a saved run; the refresh policy is explained in the rules panel and README.

## B7 — Hall of fame (20%)

As a player, I want to enter my name at the end of a run and see how it compares with other runs. Finished runs are sent to the local API, which stores them and lists the best runs in an order your team defines and shows (for example: victories first, then more wins, then fewer rounds).

The API validates every submitted run and rejects invalid or implausible data with a clear error. The interface shows loading, empty and error states, lets me retry a failed submission without retyping, and never submits the same run twice. The hall of fame is reachable as its own page. The new endpoints are documented in `docs/API.md`.

Storing the entries in memory on the server is sufficient; a database is not required.

>- Added `GET` and `POST /api/hall-of-fame`; the API validates every field and checks that the run ended and its rounds match its wins and lost lives.
>- Every run has a unique `id`. The API stores each id once, and the client saves a `submitted` flag, so retries and refreshes never create a second entry.
>- Added a name form on the result page that keeps the name after a failure, and a `/hall-of-fame` page with loading, empty, error and retry states; the player's own run is highlighted.
>- Order: more wins (5 wins = victory), then fewer rounds, then earlier submission.

## Qualitative requirements and team decisions

In addition to the functional requirements, your team must define a small set of qualitative goals for your solution. Choose goals that are relevant to your implementation and the way you expect the application to be used.

Document the selected goals, why they matter, and the decisions or trade-offs you made to support them. You should also consider how you can evaluate whether your solution meets those goals.

There is no single required architecture, or design pattern. During the exam, team members must be able to explain and defend the chosen non functionals, and discuss the resulting engineering decisions.