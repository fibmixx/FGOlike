import { getServant } from '@/data/servants';
import { ASCENSION_COST, LEVEL_CAPS, expToNext } from '../constants';
import type { ServantInstance } from '../types';

export function levelCap(inst: ServantInstance): number {
  return LEVEL_CAPS[inst.ascension];
}

/** Passive bonus of ascensions 3 and 4 (+8% stats each). */
function ascensionBonus(asc: number): number {
  return 1 + 0.08 * Math.max(0, asc - 2);
}

export function statsFor(inst: ServantInstance): { maxHp: number; atk: number } {
  const def = getServant(inst.defId);
  const t = (inst.level - 1) / 89;
  const b = ascensionBonus(inst.ascension);
  return {
    maxHp: Math.round((def.hp[0] + (def.hp[1] - def.hp[0]) * t) * b),
    atk: Math.round((def.atk[0] + (def.atk[1] - def.atk[0]) * t) * b),
  };
}

/** Unlocked skills by ascension (1 → 3). */
export function unlockedSkills(ascension: number): number {
  return Math.min(3, 1 + ascension);
}

/** Adds EXP and returns the previous level. EXP stops at the level cap. */
export function gainExp(inst: ServantInstance, amount: number): number {
  const from = inst.level;
  const cap = levelCap(inst);
  const oldMax = statsFor(inst).maxHp;
  inst.exp += amount;
  while (inst.level < cap && inst.exp >= expToNext(inst.level)) {
    inst.exp -= expToNext(inst.level);
    inst.level++;
  }
  if (inst.level >= cap) inst.exp = Math.min(inst.exp, expToNext(inst.level));
  // Current HP grows with max HP (if alive)
  if (inst.hp > 0) inst.hp += statsFor(inst).maxHp - oldMax;
  return from;
}

export function ascensionCost(inst: ServantInstance): number | null {
  if (inst.ascension >= ASCENSION_COST.length) return null;
  return ASCENSION_COST[inst.ascension];
}

export function canAscend(inst: ServantInstance, crystals: number): boolean {
  const cost = ascensionCost(inst);
  return cost !== null && inst.level >= levelCap(inst) && crystals >= cost;
}

/** Performs the ascension and returns the crystal cost. */
export function ascend(inst: ServantInstance): number {
  const cost = ascensionCost(inst);
  if (cost === null) return 0;
  const oldMax = statsFor(inst).maxHp;
  inst.ascension++;
  if (inst.hp > 0) inst.hp += statsFor(inst).maxHp - oldMax;
  return cost;
}

export const ASCENSION_UNLOCK_TEXT = [
  'Unlocks the 2nd skill',
  'Unlocks the 3rd skill',
  '+8% HP/ATK (3rd Ascension)',
  '+8% HP/ATK (Final Ascension)',
];
