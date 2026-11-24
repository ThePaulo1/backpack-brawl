import { useEffect, useState, type ReactNode } from "react";
import { newGame } from "../game";
import { loadGame, saveGame } from "../storage";
import type { GameState } from "../types";
import { GameContext, type GameContextValue } from "./GameContext";

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/** Holds the game state for all routes and saves it, so it survives navigating and refreshing. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [game, setGame] = useState<GameState | null>(loadGame);

  useEffect(() => {
    if (game) saveGame(game);
  }, [game]);

  const value: GameContextValue = {
    game,
    startNewRun: () => setGame(newGame(randomSeed(), `${Date.now()}-${randomSeed()}`)),
    update: (transition) => setGame((current) => (current ? transition(current) : current)),
  };

  return <GameContext value={value}>{children}</GameContext>;
}
