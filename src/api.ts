import type { HallOfFameEntry, Opponent, RunState } from "./types";

/** A request that takes longer than this counts as failed. */
const TIMEOUT_MS = 10_000;
const UNAVAILABLE = "The arena could not be reached.";

/** Sends a request and reads the JSON answer; throws with an understandable message on failure. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => {
    throw new Error(UNAVAILABLE);
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return response.json().catch(() => {
    throw new Error(UNAVAILABLE);
  }) as Promise<T>;
}

/** Asks the API for this round's opponent. */
export function fetchOpponent(round: number): Promise<Opponent> {
  return request(`/api/opponents?round=${encodeURIComponent(round)}`);
}

/** All submitted runs, best first. */
export function fetchHallOfFame(): Promise<HallOfFameEntry[]> {
  return request("/api/hall-of-fame");
}

/** Submits a finished run; sending the same run again is harmless. */
export function submitRun(run: RunState, name: string): Promise<HallOfFameEntry> {
  const entry: HallOfFameEntry = { runId: run.id, name: name.trim(), wins: run.wins, rounds: run.round, lives: run.lives };
  return request("/api/hall-of-fame", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}
