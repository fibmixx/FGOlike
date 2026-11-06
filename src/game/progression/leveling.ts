import { getServant } from '@/data/servants';
import { ASCENSION_COST, LEVEL_CAPS, expToNext } from '../constants';
import type { ServantInstance } from '../types';

export function levelCap(inst: ServantInstance): number {
  return LEVEL_CAPS[inst.ascension];
}

/** Bonus pasivo de las ascensiones 3 y 4 (+8% stats cada una). */
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

/** Cuántas skills tiene desbloqueadas según su ascensión (1 → 3). */
export function unlockedSkills(ascension: number): number {
  return Math.min(3, 1 + ascension);
}

/** Añade EXP. Devuelve el nivel anterior. La EXP se "congela" al llegar al tope. */
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
  // Al subir de nivel, la vida actual sube lo mismo que la máxima (si está vivo)
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

/** Ejecuta la ascensión. Devuelve el coste pagado. */
export function ascend(inst: ServantInstance): number {
  const cost = ascensionCost(inst);
  if (cost === null) return 0;
  const oldMax = statsFor(inst).maxHp;
  inst.ascension++;
  if (inst.hp > 0) inst.hp += statsFor(inst).maxHp - oldMax;
  return cost;
}

export const ASCENSION_UNLOCK_TEXT = [
  'Desbloquea la 2ª habilidad',
  'Desbloquea la 3ª habilidad',
  '+8% HP/ATK (Ascensión III)',
  '+8% HP/ATK (Ascensión final)',
];
