import { GACHA_POOL } from '@/data/servants';
import type { Rng } from '../rng';

/** Pesos por rareza: según avanzas, suben las probabilidades de 4★ y 5★. */
function rarityWeight(rarity: number, singularity: number): number {
  switch (rarity) {
    case 5: return 4 + singularity * 2;
    case 4: return 14 + singularity * 2;
    case 3: return 40;
    case 2: return Math.max(10, 25 - singularity * 3);
    default: return Math.max(8, 20 - singularity * 3);
  }
}

/** Devuelve `count` ids distintos. Pueden coincidir con Servants del equipo (→ NP+1). */
export function rollGacha(rng: Rng, singularity: number, count = 3, opts: { maxRarity?: number } = {}): string[] {
  const pool = GACHA_POOL.filter((s) => s.rarity <= (opts.maxRarity ?? 5));
  const result: string[] = [];
  while (result.length < count && result.length < pool.length) {
    const candidates = pool
      .filter((s) => !result.includes(s.id))
      .map((s) => ({ item: s.id, weight: rarityWeight(s.rarity, singularity) }));
    result.push(rng.weighted(candidates));
  }
  return result;
}
