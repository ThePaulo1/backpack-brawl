import {
  BURN_DAMAGE_PER_STACK,
  BURN_DECAY_PER_TICK,
  BURN_TICK_INTERVAL,
  HERO_BASE_HP,
  MAX_TICKS,
  POISON_DAMAGE_PER_STACK,
  POISON_TICK_INTERVAL,
  TICK_SECONDS,
} from "./battle";
import { GOLD_PER_ROUND, START_GOLD, START_LIVES, WINS_TO_VICTORY } from "./run";
import {
  FIRE_COOLDOWN_REDUCTION,
  FIRE_ITEM_COOLDOWN,
  GUARDIAN_STARTING_BLOCK,
  ITEM_SET_THRESHOLD,
} from "./sets";
import { BACKPACK_COLS, BACKPACK_ROWS, SHOP_SIZE } from "./shop";
import type { ItemEffects } from "./types";

/**
 * Player-facing explanations of the rules. Built from the game constants so
 * the texts stay correct when numbers are rebalanced.
 */

const BATTLE_SECONDS = MAX_TICKS * TICK_SECONDS;

/** Tooltip per item effect. */
export const EFFECT_HELP: Record<keyof ItemEffects, string> = {
  damage: "Damage: hits the enemy. Block absorbs it first, the rest is lost from HP.",
  block: "Block: absorbs incoming damage until used up. Unused block stays for the rest of the battle.",
  poison: `Poison: adds stacks to the enemy. Every ${POISON_TICK_INTERVAL} ticks (${POISON_TICK_INTERVAL * TICK_SECONDS} s), each stack deals ${POISON_DAMAGE_PER_STACK} HP damage, ignoring block. Stacks last for the battle; poison added on a pulse tick is included in that pulse.`,
  heal: "Heal: restores this much HP immediately, up to the fighter's max HP.",
  burn: `Fire items add 1 Burn stack when they fire: every ${FIRE_ITEM_COOLDOWN} ticks, or every ${FIRE_ITEM_COOLDOWN - FIRE_COOLDOWN_REDUCTION} with the Fire set (Poison items fire every 4 or more ticks). Burn ticks every ${BURN_TICK_INTERVAL} tick (${BURN_TICK_INTERVAL * TICK_SECONDS} s), dealing ${BURN_DAMAGE_PER_STACK} damage per stack. Block absorbs it first; then Burn decays by ${BURN_DECAY_PER_TICK} stack. New Burn starts ticking on the next tick.`,
};

export const COOLDOWN_HELP = `Cooldown: the item fires every time this much battle time has passed (1 tick = ${TICK_SECONDS} s).`;

/** Tooltip per fighter status shown in battle. */
export const STATUS_HELP = {
  hp: "HP: reaching 0 is a knockout.",
  block: EFFECT_HELP.block,
  poison: EFFECT_HELP.poison,
  burn: EFFECT_HELP.burn,
  timer: `After ${BATTLE_SECONDS} s the fighter with the higher share of HP wins; a tie counts as your loss.`,
};

export interface RuleSection {
  title: string;
  rules: string[];
}

export const RULES: RuleSection[] = [
  {
    title: "🏆 The run",
    rules: [
      `Reach ${WINS_TO_VICTORY} wins before you lose all ${START_LIVES} lives.`,
      `Each battle is one round: a win gives +1 win, a loss costs 1 life.`,
      `Opponents get tougher every round.`,
    ],
  },
  {
    title: "🏪 Shop & backpack",
    rules: [
      `You start with ${START_GOLD} 🪙 and earn ${GOLD_PER_ROUND} 🪙 at the start of every new round. Unspent gold carries over.`,
      `The shop offers ${SHOP_SIZE} new items every round.`,
      `Bought items go to the first free slot of your ${BACKPACK_COLS}×${BACKPACK_ROWS} backpack and stay there for the whole run.`,
      `Only items in your backpack fight. Their position doesn't matter.`,
      `Collect ${ITEM_SET_THRESHOLD} or more items from a set to activate its bonus; duplicate items count.`,
      `Fire bonus: Fire items recharge ${FIRE_COOLDOWN_REDUCTION} tick sooner. Guardian bonus: start battle with ${GUARDIAN_STARTING_BLOCK} extra block.`,
    ],
  },
  {
    title: "⚔️ Battle",
    rules: [
      `Battles run on their own. Your hero has ${HERO_BASE_HP} HP; every item fires whenever its cooldown is up.`,
      `Damage hits block first; only the rest is lost from HP. Unused block stays for the rest of the battle.`,
      EFFECT_HELP.poison,
      EFFECT_HELP.heal,
      EFFECT_HELP.burn,
      `Knock the enemy out to win. ${STATUS_HELP.timer} If both fall at once, you lose.`,
    ],
  },
];
