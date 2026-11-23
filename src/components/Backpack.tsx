import { TICK_SECONDS } from "../battle";
import { describeEffects, getItem } from "../items";
import { EFFECT_HELP } from "../rules";
import { BACKPACK_COLS } from "../shop";
import type { Backpack as BackpackSlots, ItemDef } from "../types";
import { useState } from "react";

/** Hover text for a backpack slot: name, effects and cooldown. */
const tooltip = (item: ItemDef) =>
  [
    item.name,
    ...describeEffects(item.effects).flatMap(({ effect, label }) => [label, EFFECT_HELP[effect]]),
    `⏱️ every ${item.cooldown * TICK_SECONDS}s`,
  ].join("\n");

interface BackpackProps {
  backpack: BackpackSlots;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export function Backpack({ backpack, onMove }: BackpackProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function handleSlot(index: number) {
    if (selectedIndex === null) {
      setSelectedIndex(backpack[index] ? index : null);
    } else {
      onMove(selectedIndex, index);
      setSelectedIndex(null);
    }
  }

  return (
    <section className="rounded-lg border border-panel-edge bg-panel p-4">
      <h2 className="font-display text-xl font-bold">🎒 Backpack</h2>
      <p className="mb-2 text-sm text-muted">
        {selectedIndex === null ? "Select an item, then choose a destination slot." : "Selected: choose an empty or occupied slot."}
      </p>
      {selectedIndex !== null && (
        <button
          type="button"
          onClick={() => setSelectedIndex(null)}
          className="mb-3 rounded-md border border-panel-edge px-3 py-1 text-sm hover:border-gold"
        >
          Cancel selection
        </button>
      )}
      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${BACKPACK_COLS}, minmax(0, 1fr))` }}>
        {backpack.map((slot, index) => {
          const item = slot ? getItem(slot.itemId) : null;
          const selected = selectedIndex === index;
          const canSelect = selectedIndex !== null || item !== null;
          const title = selected
            ? "Selected item — choose a destination or cancel"
            : selectedIndex !== null
              ? item
                ? "Move here and swap items"
                : "Move here"
              : item
                ? "Select item"
                : "Empty slot";
          return (
            <li
              key={slot?.uid ?? `empty-${index}`}
            >
              <button
                type="button"
                onClick={() => handleSlot(index)}
                disabled={!canSelect}
                title={item ? `${title}\n${tooltip(item)}` : title}
                aria-label={item ? `${selected ? "Selected " : ""}${item.name} in slot ${index + 1}` : `Empty slot ${index + 1}`}
                aria-pressed={selected}
                className={[
                  "flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 p-1",
                  item ? "border-gold/40 bg-ink/40" : "border-dashed border-panel-edge",
                  selected ? "ring-2 ring-gold ring-offset-2 ring-offset-panel" : "",
                  canSelect ? "hover:border-gold cursor-pointer" : "cursor-not-allowed",
                ].join(" ")}
              >
                {item && (
                  <>
                    <span className="text-3xl leading-none sm:text-4xl" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="text-center text-xs leading-tight">{item.name}</span>
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
