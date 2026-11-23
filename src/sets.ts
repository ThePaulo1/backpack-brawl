import type { ItemSetId } from "./types";

export const ITEM_SET_THRESHOLD = 2;
export const FIRE_ITEM_COOLDOWN = 3;
export const FIRE_COOLDOWN_REDUCTION = 1;
export const GUARDIAN_STARTING_BLOCK = 2;

export const ITEM_SETS: Record<ItemSetId, { name: string; icon: string; bonus: string }> = {
  fire: {
    name: "Fire",
    icon: "🔥",
    bonus: `Fire items recharge every ${FIRE_ITEM_COOLDOWN - FIRE_COOLDOWN_REDUCTION} ticks instead of ${FIRE_ITEM_COOLDOWN}.`,
  },
  guardian: {
    name: "Guardian",
    icon: "🛡️",
    bonus: `Start battle with ${GUARDIAN_STARTING_BLOCK} extra block.`,
  },
};

/** Returns the set bonuses active for two or more item instances in a fighter's inventory. */
export function activeItemSets(items: readonly { set?: ItemSetId }[]): ItemSetId[] {
  return (Object.keys(ITEM_SETS) as ItemSetId[]).filter(
    (setId) => items.filter((item) => item.set === setId).length >= ITEM_SET_THRESHOLD,
  );
}
