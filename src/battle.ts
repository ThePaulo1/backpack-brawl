import { getItem } from "./items";
import { itemIdsOf } from "./shop";
import { activeItemSets, FIRE_COOLDOWN_REDUCTION, GUARDIAN_STARTING_BLOCK } from "./sets";
import type { Backpack, BattleEvent, BattleResult, Fighter, FighterItem, FighterSnapshot, Opponent, Side } from "./types";

/** Seconds per battle tick. */
export const TICK_SECONDS = 0.5;
/** Battles that last longer are decided by the timeout rule. */
export const MAX_TICKS = 60;
export const HERO_BASE_HP = 40;
/** Poison pulses once every 2 ticks (1 second) for 1 HP per stack, ignoring block. */
export const POISON_TICK_INTERVAL = 2;
export const POISON_DAMAGE_PER_STACK = 1;
/** Burn pulses every tick for 2 damage per stack, then loses 1 stack. */
export const BURN_TICK_INTERVAL = 1;
export const BURN_DAMAGE_PER_STACK = 2;
export const BURN_DECAY_PER_TICK = 1;

/** Turns a list of item ids into a fighter with the catalog values of each item. */
export function buildFighter(itemIds: string[], baseHp: number, name = "Fighter"): Fighter {
  const items: FighterItem[] = itemIds.map((id) => {
    const def = getItem(id);
    return {
      itemId: def.id,
      name: def.name,
      icon: def.icon,
      cooldown: def.cooldown,
      effects: { ...def.effects },
      set: def.set,
    };
  });
  return { name, maxHp: baseHp, items, activeSets: activeItemSets(items) };
}

/** The player's fighter: every backpack item and the hero's base HP. */
export function buildPlayerFighter(backpack: Backpack): Fighter {
  return buildFighter(itemIdsOf(backpack), HERO_BASE_HP, "Hero");
}

export function buildOpponentFighter(opponent: Opponent): Fighter {
  return buildFighter(opponent.items, opponent.hp, opponent.name);
}

interface FighterState {
  fighter: Fighter;
  hp: number;
  block: number;
  poison: { stacks: number; source: Side; itemId: string } | null;
  burn: { stacks: number; source: Side; itemId: string; appliedTick: number } | null;
  /** Ticks each item has charged towards its cooldown. */
  charge: number[];
}

const other = (side: Side): Side => (side === "player" ? "opponent" : "player");

const snapshot = (s: FighterState): FighterSnapshot => ({
  hp: Math.max(0, s.hp),
  maxHp: s.fighter.maxHp,
  block: s.block,
  poison: s.poison?.stacks ?? 0,
  burn: s.burn?.stacks ?? 0,
});

const isDown = (s: FighterState) => s.hp <= 0;

/**
 * Runs a full battle. Pure and deterministic: the same fighters always give
 * the same result.
 *
 * Each tick:
 * 1. Each fighter charges all items by one tick; items whose charge reaches their cooldown fire.
 * 2. Fired items resolve (player first, then opponent). Both sides fire "simultaneously":
 *    which items fire is decided before any effect is applied.
 * After step 2 the battle ends if someone is down; if both are down, the player loses.
 * After `MAX_TICKS` the higher HP percentage wins; a tie is a player loss.
 */
export function simulateBattle(player: Fighter, opponent: Fighter): BattleResult {
  const state: Record<Side, FighterState> = {
    player: initState(player),
    opponent: initState(opponent),
  };
  const frames: BattleResult["frames"] = [
    { tick: 0, player: snapshot(state.player), opponent: snapshot(state.opponent), events: [] },
  ];
  const events: BattleEvent[] = [];

  const knockoutWinner = (): Side | null => {
    if (isDown(state.player)) return "opponent";
    if (isDown(state.opponent)) return "player";
    return null;
  };

  let winner: Side | null = null;
  let tick = 0;
  while (winner === null && tick < MAX_TICKS) {
    tick += 1;
    const tickEvents: BattleEvent[] = [];
    const emit = (event: Omit<BattleEvent, "tick">) => tickEvents.push({ tick, ...event });

    const fired: Record<Side, FighterItem[]> = {
      player: chargeItems(state.player),
      opponent: chargeItems(state.opponent),
    };
    for (const side of ["player", "opponent"] as const) {
      for (const item of fired[side]) resolveItem(item, state[side], state[other(side)], side, emit, tick);
    }
    if (tick % BURN_TICK_INTERVAL === 0) {
      for (const side of ["player", "opponent"] as const) {
        const burning = state[side];
        if (!burning.burn || tick <= burning.burn.appliedTick) continue;
        const { stacks, source, itemId } = burning.burn;
        const damage = stacks * BURN_DAMAGE_PER_STACK;
        const absorbed = Math.min(burning.block, damage);
        burning.block -= absorbed;
        burning.hp -= damage - absorbed;
        const note = absorbed > 0 ? ` (${absorbed} blocked)` : "";
        emit({
          source,
          target: side,
          kind: "burnDamage",
          amount: damage,
          itemId,
          message: `${burning.fighter.name} takes ${damage} burn damage${note}; burn decays by ${BURN_DECAY_PER_TICK}`,
        });
        const remaining = stacks - BURN_DECAY_PER_TICK;
        burning.burn = remaining > 0 ? { ...burning.burn, stacks: remaining } : null;
      }
    }
    if (tick % POISON_TICK_INTERVAL === 0) {
      for (const side of ["player", "opponent"] as const) {
        const poisoned = state[side];
        if (!poisoned.poison) continue;
        const { stacks, source, itemId } = poisoned.poison;
        const amount = stacks * POISON_DAMAGE_PER_STACK;
        poisoned.hp -= amount;
        emit({
          source,
          target: side,
          kind: "poisonDamage",
          amount,
          itemId,
          message: `${poisoned.fighter.name} takes ${amount} poison damage (${stacks} stack${stacks === 1 ? "" : "s"}); poison ignores block`,
        });
      }
    }
    winner = knockoutWinner();

    frames.push({ tick, player: snapshot(state.player), opponent: snapshot(state.opponent), events: tickEvents });
    events.push(...tickEvents);
  }

  if (winner !== null) return { winner, reason: "knockout", frames, events };
  return { winner: timeoutWinner(state.player, state.opponent), reason: "timeout", frames, events };
}

function initState(fighter: Fighter): FighterState {
  return {
    fighter,
    hp: fighter.maxHp,
    block: fighter.activeSets.includes("guardian") ? GUARDIAN_STARTING_BLOCK : 0,
    poison: null,
    burn: null,
    charge: fighter.items.map(() => 0),
  };
}

/** Advances one tick of cooldowns and returns the items that fire this tick. */
function chargeItems(s: FighterState): FighterItem[] {
  const fired: FighterItem[] = [];
  s.fighter.items.forEach((item, i) => {
    s.charge[i] += 1;
    const cooldown =
      item.set === "fire" && s.fighter.activeSets.includes("fire")
        ? Math.max(1, item.cooldown - FIRE_COOLDOWN_REDUCTION)
        : item.cooldown;
    if (s.charge[i] >= cooldown) {
      s.charge[i] = 0;
      fired.push(item);
    }
  });
  return fired;
}

function resolveItem(
  item: FighterItem,
  self: FighterState,
  enemy: FighterState,
  side: Side,
  emit: (event: Omit<BattleEvent, "tick">) => void,
  tick: number,
) {
  const { damage, block, poison, heal, burn } = item.effects;
  const base = { source: side, itemId: item.itemId };
  const enemySide = other(side);

  if (damage) {
    const absorbed = Math.min(enemy.block, damage);
    enemy.block -= absorbed;
    enemy.hp -= damage - absorbed;
    const note = absorbed > 0 ? ` (${absorbed} blocked)` : "";
    emit({ ...base, target: enemySide, kind: "damage", amount: damage, message: `${item.name} hits ${enemy.fighter.name} for ${damage}${note}` });
  }
  if (block) {
    self.block += block;
    emit({ ...base, target: side, kind: "block", amount: block, message: `${item.name} grants ${self.fighter.name} ${block} block` });
  }
  if (poison) {
    const stacks = (enemy.poison?.stacks ?? 0) + poison;
    enemy.poison = { stacks, source: side, itemId: item.itemId };
    emit({
      ...base,
      target: enemySide,
      kind: "poison",
      amount: poison,
      message: `${item.name} adds ${poison} poison stack${poison === 1 ? "" : "s"} to ${enemy.fighter.name} (${stacks} total)`,
    });
  }
  if (burn) {
    const stacks = (enemy.burn?.stacks ?? 0) + burn;
    enemy.burn = { stacks, source: side, itemId: item.itemId, appliedTick: tick };
    emit({
      ...base,
      target: enemySide,
      kind: "burn",
      amount: burn,
      message: `${item.name} adds ${burn} burn stack${burn === 1 ? "" : "s"} to ${enemy.fighter.name} (${stacks} total)`,
    });
  }
  if (heal) {
    const restored = self.hp > 0 ? Math.min(heal, self.fighter.maxHp - self.hp) : 0;
    self.hp += restored;
    emit({
      ...base,
      target: side,
      kind: "heal",
      amount: restored,
      message: restored > 0
        ? `${item.name} heals ${self.fighter.name} for ${restored} HP`
        : self.hp <= 0
          ? `${item.name} cannot heal ${self.fighter.name}; knocked out`
          : `${item.name} cannot heal ${self.fighter.name}; already at max HP`,
    });
  }
}

function timeoutWinner(player: FighterState, opponent: FighterState): Side {
  const ratio = (s: FighterState) => s.hp / s.fighter.maxHp;
  return ratio(player) > ratio(opponent) ? "player" : "opponent";
}
