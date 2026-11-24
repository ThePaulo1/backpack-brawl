import { buildReplay, isReplayDone } from "./game";
import { getItem } from "./items";
import { GOLD_PER_ROUND, runOutcome, START_GOLD, START_LIVES, WINS_TO_VICTORY } from "./run";
import { BACKPACK_SIZE, itemIdsOf, SHOP_SIZE } from "./shop";
import type { BattleReplay, GameState, Opponent, Phase, RunState } from "./types";

/** Increase the version when the saved format changes; older saves are then ignored. */
const STORAGE_KEY = "backpack-brawl-run-v2";

/** The battle itself is not saved: it is simulated again from the backpack and the opponent. */
interface SavedGame {
  phase: Phase;
  run: RunState;
  battle: { opponent: Opponent; frame: number } | null;
}

export function saveGame(game: GameState): void {
  const { run, battle } = game;
  const saved: SavedGame = {
    // A search can't survive a refresh, so it resumes in the shop.
    phase: game.phase === "searching" ? "shop" : game.phase,
    run,
    battle: battle && { opponent: battle.opponent, frame: battle.frame },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Storage is unavailable: the game stays playable, it just can't be resumed.
  }
}

/** The saved game, or `null` if there is none or it can't be trusted. */
export function loadGame(): GameState | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json === null ? null : restoreGame(json);
  } catch {
    return null;
  }
}

/** Parses and validates a saved game; throws if it is malformed or impossible. */
function restoreGame(json: string): GameState {
  const { phase, run, battle } = JSON.parse(json) as SavedGame;
  checkRun(run);
  if (phase === "battle") {
    check(battle !== null);
    return { phase, run, battle: restoreReplay(run, battle.opponent, battle.frame), searchId: null, error: null };
  }
  check(phase === (runOutcome(run) ? "finished" : "shop"));
  return { phase, run, battle: null, searchId: null, error: null };
}

function check(condition: boolean): asserts condition {
  if (!condition) throw new Error("Invalid saved game");
}

const isIntBetween = (value: number, min: number, max = Number.MAX_SAFE_INTEGER) =>
  Number.isSafeInteger(value) && value >= min && value <= max;

function checkRun(run: RunState): void {
  check(typeof run.id === "string" && run.id !== "");
  check(run.submitted === false || (run.submitted === true && runOutcome(run) !== null));
  check(isIntBetween(run.round, 1));
  check(isIntBetween(run.gold, 0));
  check(isIntBetween(run.wins, 0, WINS_TO_VICTORY));
  check(isIntBetween(run.lives, 0, START_LIVES));
  check(isIntBetween(run.seed, 0, 2 ** 32 - 1));
  check(isIntBetween(run.nextUid, 1));

  // Every battle is a win or a lost life, and the last battle ends the run.
  check(run.wins < WINS_TO_VICTORY || run.lives > 0);
  const battles = run.wins + START_LIVES - run.lives;
  check(battles === (runOutcome(run) ? run.round : run.round - 1));

  check(Array.isArray(run.shop) && run.shop.length === SHOP_SIZE);
  for (const itemId of run.shop) if (itemId !== null) getItem(itemId); // throws for unknown items

  check(Array.isArray(run.backpack) && run.backpack.length === BACKPACK_SIZE);
  const items = run.backpack.filter((slot) => slot !== null);
  check(new Set(items.map((item) => item.uid)).size === items.length);
  for (const { uid } of items) check(/^item-[1-9]\d*$/.test(uid) && Number(uid.slice("item-".length)) < run.nextUid);

  // Gold only comes from the start and from new rounds; it is either unspent or was spent on items.
  const itemValue = items.reduce((sum, item) => sum + getItem(item.itemId).price, 0);
  check(run.gold + itemValue <= START_GOLD + GOLD_PER_ROUND * (run.round - 1));
}

function restoreReplay(run: RunState, opponent: Opponent, frame: number): BattleReplay {
  check([opponent.id, opponent.name, opponent.icon].every((text) => typeof text === "string"));
  check(isIntBetween(opponent.hp, 1) && isIntBetween(opponent.round, 1));
  check(Array.isArray(opponent.items) && opponent.items.length <= BACKPACK_SIZE);
  check(itemIdsOf(run.backpack).length > 0);

  const replay = buildReplay(run.backpack, opponent, frame);
  check(isIntBetween(frame, 0, replay.result.frames.length - 1));

  // The last frame already applied the result, which starts the next round unless the run is over.
  const done = isReplayDone(replay);
  const outcome = runOutcome(run);
  const won = replay.result.winner === "player";
  check(opponent.round === (done && !outcome ? run.round - 1 : run.round));
  if (done) check(won ? run.wins > 0 : run.lives < START_LIVES);
  if (outcome) check(done && won === (outcome === "victory"));
  return replay;
}
