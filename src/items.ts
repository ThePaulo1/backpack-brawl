import type { ItemDef, ItemEffects } from "./types";
import { FIRE_ITEM_COOLDOWN } from "./sets";

export const CATALOG: ItemDef[] = [
  { id: "chipped-dagger", name: "Chipped Dagger", icon: "🗡️", price: 2, cooldown: 4, effects: { damage: 3 } },
  { id: "hunting-bow", name: "Hunting Bow", icon: "🏹", price: 4, cooldown: 4, effects: { damage: 5 } },
  { id: "iron-cleaver", name: "Iron Cleaver", icon: "🪓", price: 5, cooldown: 8, effects: { damage: 12 } },
  { id: "oak-buckler", name: "Oak Buckler", icon: "🛡️", price: 3, cooldown: 5, effects: { block: 4 }, set: "guardian" },
  { id: "pot-lid", name: "Pot Lid", icon: "🍳", price: 2, cooldown: 3, effects: { block: 2 }, set: "guardian" },
  { id: "spiked-shield", name: "Spiked Shield", icon: "⚔️", price: 4, cooldown: 6, effects: { damage: 3, block: 3 }, set: "guardian" },
  { id: "viper-tooth", name: "Viper Tooth", icon: "🐍", price: 3, cooldown: 4, effects: { poison: 1 } },
  { id: "venom-flask", name: "Venom Flask", icon: "🧪", price: 5, cooldown: 6, effects: { poison: 2 } },
  { id: "plague-needle", name: "Plague Needle", icon: "🪡", price: 4, cooldown: 5, effects: { damage: 2, poison: 1 } },
  { id: "healing-herb", name: "Healing Herb", icon: "🌿", price: 3, cooldown: 4, effects: { heal: 4 } },
  { id: "field-kit", name: "Field Kit", icon: "🩹", price: 5, cooldown: 7, effects: { heal: 7 } },
  { id: "restorative-tonic", name: "Restorative Tonic", icon: "🍵", price: 4, cooldown: 5, effects: { heal: 3, block: 2 } },
  { id: "ember-sword", name: "Ember Sword", icon: "🔥", price: 4, cooldown: FIRE_ITEM_COOLDOWN, effects: { damage: 4, burn: 1 }, set: "fire" },
  { id: "cinder-bomb", name: "Cinder Bomb", icon: "💣", price: 5, cooldown: FIRE_ITEM_COOLDOWN, effects: { damage: 5, burn: 1 }, set: "fire" },
  { id: "flame-brazier", name: "Flame Brazier", icon: "🪔", price: 4, cooldown: FIRE_ITEM_COOLDOWN, effects: { block: 3, burn: 1 }, set: "fire" },
];

const byId = new Map(CATALOG.map((item) => [item.id, item]));

export function getItem(id: string): ItemDef {
  const item = byId.get(id);
  if (!item) throw new Error(`Unknown item: ${id}`);
  return item;
}

const EFFECT_LABELS: [keyof ItemEffects, (n: number) => string][] = [
  ["damage", (n) => `⚔️ ${n} dmg`],
  ["block", (n) => `🛡️ +${n} block`],
  ["poison", (n) => `☠️ +${n} poison`],
  ["heal", (n) => `💚 heal ${n}`],
  ["burn", (n) => `🔥 +${n} burn`],
];

/** Short labels for an item's effects, e.g. `[{ effect: "damage", label: "⚔️ 2 dmg" }, …]`. */
export function describeEffects(effects: ItemEffects): { effect: keyof ItemEffects; label: string }[] {
  return EFFECT_LABELS.flatMap(([effect, label]) => (effects[effect] ? [{ effect, label: label(effects[effect]) }] : []));
}
