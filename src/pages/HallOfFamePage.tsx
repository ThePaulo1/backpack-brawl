import { useEffect, useState } from "react";
import { fetchHallOfFame } from "../api";
import { WINS_TO_VICTORY } from "../run";
import { useGame } from "../state/GameContext";
import type { HallOfFameEntry } from "../types";

export function HallOfFamePage() {
  const { game } = useGame();
  const [entries, setEntries] = useState<HallOfFameEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(1);

  useEffect(() => {
    let active = true;
    fetchHallOfFame().then(
      (loaded) => active && setEntries(loaded),
      (failure: Error) => active && setError(failure.message),
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  function handleRetry() {
    setError(null);
    setAttempt(attempt + 1);
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-panel-edge bg-panel p-4">
      <h2 className="font-display text-xl font-bold">🏅 Hall of fame</h2>
      <p className="text-sm text-muted">
        Ranked by wins ({WINS_TO_VICTORY} wins = victory), then fewer rounds, then earlier submission.
      </p>
      {error ? (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-life">
          ⚠️ {error}
          <button type="button" onClick={handleRetry} className="rounded-md border border-panel-edge px-3 py-1 text-sm text-parchment hover:border-gold">
            Try again
          </button>
        </div>
      ) : entries === null ? (
        <p role="status" className="animate-pulse text-gold">
          Loading the best runs…
        </p>
      ) : entries.length === 0 ? (
        <p className="text-muted">No runs yet. Finish a run to be the first!</p>
      ) : (
        <table className="w-full text-left">
          <thead className="text-xs uppercase tracking-wider text-muted">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Result</th>
              <th>Wins</th>
              <th>Rounds</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, index) => {
              const own = entry.runId === game?.run.id;
              return (
                <tr key={entry.runId} className={own ? "bg-gold/15 text-gold" : ""}>
                  <td>{index + 1}</td>
                  <td className="break-all">
                    {entry.name}
                    {own && " (you)"}
                  </td>
                  <td>{entry.wins === WINS_TO_VICTORY ? "👑 Victory" : "🪦 Defeat"}</td>
                  <td>{entry.wins}</td>
                  <td>{entry.rounds}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
