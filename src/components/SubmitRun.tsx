import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { submitRun } from "../api";
import { ROUTES } from "../game";
import type { RunState } from "../types";

/** Must match the limit in server/hallOfFame.js. */
const MAX_NAME_LENGTH = 20;

interface SubmitRunProps {
  run: RunState;
  onSubmitted: () => void;
}

/** Name form for a finished run; a failed submission keeps the name for a retry. */
export function SubmitRun({ run, onSubmitted }: SubmitRunProps) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (run.submitted) {
    return (
      <p role="status">
        ✅ Your run was submitted.{" "}
        <Link to={ROUTES.hallOfFame} className="text-gold underline">
          See how it compares
        </Link>
      </p>
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitRun(run, name);
      onSubmitted();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Submission failed.");
    }
    setSubmitting(false);
  }

  const nameMissing = name.trim() === "";
  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-2">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Your name for the hall of fame
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={MAX_NAME_LENGTH}
          disabled={submitting}
          autoFocus
          className="rounded-md border border-panel-edge bg-ink px-3 py-2 text-parchment"
        />
      </label>
      {error && (
        <p role="alert" className="text-life">
          ⚠️ {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting || nameMissing}
        className="rounded-md bg-gold px-5 py-2 font-display font-bold text-ink hover:brightness-110 disabled:bg-panel-edge disabled:text-muted"
      >
        {submitting ? "Submitting…" : nameMissing ? "Enter your name first" : error ? "Retry" : "🏅 Submit run"}
      </button>
    </form>
  );
}
