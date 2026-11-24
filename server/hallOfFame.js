/** Run limits; must match src/run.ts. */
const WINS_TO_VICTORY = 5;
const START_LIVES = 3;
export const MAX_NAME_LENGTH = 20;
const MAX_ID_LENGTH = 64;

/** Finished runs, best first. Kept in memory only. */
const entries = [];

const isIntBetween = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

/** Why a submitted run is rejected, or `null` if it is valid and plausible. */
function submissionError(run) {
  const { runId, name, wins, rounds, lives } = run;
  if (typeof runId !== "string" || runId === "" || runId.length > MAX_ID_LENGTH) return `runId must be a text of 1 to ${MAX_ID_LENGTH} characters`;
  if (typeof name !== "string" || name.trim() === "" || name.trim().length > MAX_NAME_LENGTH) return `name must have 1 to ${MAX_NAME_LENGTH} characters`;
  if (!isIntBetween(wins, 0, WINS_TO_VICTORY)) return `wins must be a whole number from 0 to ${WINS_TO_VICTORY}`;
  if (!isIntBetween(lives, 0, START_LIVES)) return `lives must be a whole number from 0 to ${START_LIVES}`;
  if ((wins === WINS_TO_VICTORY) === (lives === 0)) return "the run must have ended in either victory or defeat";
  if (rounds !== wins + START_LIVES - lives) return "rounds must equal wins plus lost lives";
  return null;
}

/** Best runs first: more wins, then fewer rounds; the earlier submission wins a tie (sort is stable). */
const byRank = (a, b) => b.wins - a.wins || a.rounds - b.rounds;

export const listEntries = () => entries;

/** Stores a run once; submitting the same `runId` again returns the stored entry. */
export function submitEntry(body) {
  const run = body ?? {};
  const error = submissionError(run);
  if (error) return { status: 400, body: { error } };
  const { runId, name, wins, rounds, lives } = run;
  const existing = entries.find((entry) => entry.runId === runId);
  if (existing) return { status: 200, body: existing };
  const entry = { runId, name: name.trim(), wins, rounds, lives };
  entries.push(entry);
  entries.sort(byRank);
  return { status: 201, body: entry };
}
