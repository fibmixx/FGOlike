import generated from './generated/servants.json';
import { FALLBACK_SERVANTS } from './fallbackServants';
import type { ServantDef } from '@/game/types';

/**
 * Roster: the Atlas Academy JP import if present (npm run import:atlas),
 * otherwise the small hand-made fallback roster.
 */
const GENERATED = generated as unknown as ServantDef[];
export const SERVANTS: ServantDef[] = GENERATED.length ? GENERATED : FALLBACK_SERVANTS;
export const USING_ATLAS_DATA = GENERATED.length > 0;

const BY_ID: Record<string, ServantDef> = Object.fromEntries(SERVANTS.map((s) => [s.id, s]));

export function getServant(id: string): ServantDef {
  const s = BY_ID[id];
  if (!s) throw new Error(`Unknown servant: ${id}`);
  return s;
}

export function hasServant(id: string): boolean {
  return id in BY_ID;
}

export const GACHA_POOL = SERVANTS.filter((s) => !s.noGacha);
