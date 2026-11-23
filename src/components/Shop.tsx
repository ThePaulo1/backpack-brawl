import { getItem } from "../items";
import { buyBlocker, REROLL_COST, rerollBlocker } from "../run";
import type { RunState } from "../types";
import { ItemCard } from "./ItemCard";

interface ShopProps {
  run: RunState;
  onBuy: (offerIndex: number) => void;
  onReroll: () => void;
}

export function Shop({ run, onBuy, onReroll }: ShopProps) {
  const rerollBlocked = rerollBlocker(run);

  return (
    <section className="rounded-lg border border-panel-edge bg-panel p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-bold">🏪 Shop</h2>
        <button
          type="button"
          onClick={onReroll}
          disabled={rerollBlocked !== null}
          title={rerollBlocked ?? "Replace all offers, including sold ones"}
          className="rounded-md border border-panel-edge px-3 py-1 text-sm hover:border-gold disabled:text-muted disabled:hover:border-panel-edge"
        >
          🎲 Reroll for {REROLL_COST} 🪙{rerollBlocked && ` — ${rerollBlocked}`}
        </button>
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {run.shop.map((itemId, index) => {
          if (!itemId) {
            return (
              <li key={index} className="grid min-h-32 place-items-center rounded-lg border-2 border-dashed border-panel-edge text-sm text-muted">
                Sold
              </li>
            );
          }
          const item = getItem(itemId);
          const blocker = buyBlocker(run, index);
          return (
            <li key={index}>
              <ItemCard item={item}>
                <button
                  type="button"
                  onClick={() => onBuy(index)}
                  disabled={blocker !== null}
                  title={blocker ?? undefined}
                  className="mt-auto rounded-md bg-gold px-3 py-1.5 font-bold text-ink hover:brightness-110 disabled:bg-panel-edge disabled:text-muted"
                >
                  {blocker ?? `Buy for ${item.price} 🪙`}
                </button>
              </ItemCard>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
