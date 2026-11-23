import type { Opponent } from "./types";

/** A search that takes longer than this counts as failed. */
const SEARCH_TIMEOUT_MS = 10_000;
const UNAVAILABLE = "The arena could not be reached.";

/** Asks the API for this round's opponent; throws with an understandable message on failure. */
export async function fetchOpponent(round: number): Promise<Opponent> {
  const response = await fetch(`/api/opponents?round=${encodeURIComponent(round)}`, {
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  }).catch(() => {
    throw new Error(UNAVAILABLE);
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Opponent search failed (${response.status})`);
  }
  return response.json().catch(() => {
    throw new Error(UNAVAILABLE);
  }) as Promise<Opponent>;
}
