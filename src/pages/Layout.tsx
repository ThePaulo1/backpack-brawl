import { Link, Outlet, useLocation } from "react-router";
import { routeForGame, ROUTES } from "../game";
import { useGame } from "../state/GameContext";

export function Layout() {
  const { game } = useGame();
  const inHallOfFame = useLocation().pathname === ROUTES.hallOfFame;

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4">
      <header className="flex items-center justify-between border-b-2 border-panel-edge py-4">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          <Link to={ROUTES.start}>
            🎒 Backpack <span className="text-gold">Brawl</span>
          </Link>
        </h1>
        {inHallOfFame ? (
          <Link to={routeForGame(game)} className="hover:text-gold">
            {game ? "← Back to your run" : "← Back to start"}
          </Link>
        ) : (
          <Link to={ROUTES.hallOfFame} className="hover:text-gold">
            🏅 Hall of fame
          </Link>
        )}
      </header>

      <main className="flex flex-1 flex-col gap-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-panel-edge py-3 text-xs tracking-wider text-muted">
        Backpack Brawl · practical exam starter
      </footer>
    </div>
  );
}
