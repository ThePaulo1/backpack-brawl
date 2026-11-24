import { buildOpponentFighter, buildPlayerFighter, simulateBattle } from "./battle";
import { applyBattleResult, newRun, runOutcome } from "./run";
import { itemIdsOf } from "./shop";
import type { Backpack, BattleReplay, GameState, Opponent, RunState } from "./types";

/**
 * Phase transitions of one run: shop → searching → battle → shop … → finished.
 * Every function is pure, so they can be passed straight to `setState`.
 */

export function newGame(seed: number): GameState {
  return { phase: "shop", run: newRun(seed), battle: null, searchId: null, error: null };
}

/** Applies a shop/backpack action; only allowed while shopping. */
export function updateRun(game: GameState, action: (run: RunState) => RunState): GameState {
  if (game.phase !== "shop") return game;
  const run = action(game.run);
  return run === game.run ? game : { ...game, run };
}

/** Why the player can't look for an opponent right now, or `null` if they can. */
export function fightBlocker(game: GameState): string | null {
  if (game.phase !== "shop") return "Search already running";
  if (itemIdsOf(game.run.backpack).length === 0) return "Buy at least one item first";
  return null;
}

export function startSearch(game: GameState, searchId: symbol): GameState {
  if (fightBlocker(game) !== null) return game;
  return { ...game, phase: "searching", searchId, error: null };
}

/** Late or duplicate responses belong to a search that is no longer running. */
const isCurrentSearch = (game: GameState, searchId: symbol) => game.phase === "searching" && game.searchId === searchId;

/** Returns to the shop with an error; ignored unless `searchId` is the running search. */
export function searchFailed(game: GameState, searchId: symbol, error: string): GameState {
  if (!isCurrentSearch(game, searchId)) return game;
  return { ...game, phase: "shop", searchId: null, error };
}

/** Simulates the battle; deterministic, so a saved battle can be rebuilt after a refresh. */
export function buildReplay(backpack: Backpack, opponent: Opponent, frame = 0): BattleReplay {
  const player = buildPlayerFighter(backpack);
  const enemy = buildOpponentFighter(opponent);
  return { opponent, player, enemy, result: simulateBattle(player, enemy), frame };
}

/** Simulates the battle and starts its replay; ignored unless `searchId` is the running search. */
export function startBattle(game: GameState, searchId: symbol, opponent: Opponent): GameState {
  if (!isCurrentSearch(game, searchId)) return game;
  if (opponent.round !== game.run.round) return searchFailed(game, searchId, "The opponent was for a different round.");
  return { ...game, phase: "battle", searchId: null, battle: buildReplay(game.run.backpack, opponent) };
}

export const isReplayDone = (battle: BattleReplay) => battle.frame >= battle.result.frames.length - 1;

/** Shows the given frame; reaching the last frame applies the battle result to the run (exactly once). */
export function showFrame(game: GameState, frame: number): GameState {
  const { battle } = game;
  if (game.phase !== "battle" || !battle || isReplayDone(battle)) return game;
  const last = battle.result.frames.length - 1;
  const next = { ...battle, frame: Math.min(Math.max(frame, battle.frame), last) };
  if (!isReplayDone(next)) return { ...game, battle: next };
  return { ...game, battle: next, run: applyBattleResult(game.run, battle.result.winner) };
}

export const advanceReplay = (game: GameState) => showFrame(game, (game.battle?.frame ?? 0) + 1);
export const skipReplay = (game: GameState) => showFrame(game, Infinity);

/** Leaves a finished replay: back to the shop, or to the end screen if the run is over. */
export function leaveBattle(game: GameState): GameState {
  if (game.phase !== "battle" || !game.battle || !isReplayDone(game.battle)) return game;
  return { ...game, phase: runOutcome(game.run) ? "finished" : "shop", battle: null };
}

/** URL paths of the app's screens. */
export const ROUTES = { start: "/", shop: "/shop", battle: "/battle", result: "/result" } as const;
export type GameRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * The screen that matches the game's phase. Shop, battle and result pages
 * redirect here when they don't match, so the URL always follows the phase.
 */
export function routeForGame(game: GameState | null): GameRoute {
  if (!game) return ROUTES.start;
  switch (game.phase) {
    case "shop":
    case "searching":
      return ROUTES.shop;
    case "battle":
      return ROUTES.battle;
    case "finished":
      return ROUTES.result;
  }
}
