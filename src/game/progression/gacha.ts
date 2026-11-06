import { GACHA_POOL } from '@/data/servants';
import type { Rng } from '../rng';

/** Chance of each rarity per slot; 4★/5★ become likelier as you progress. */
export function rarityWeights(singularity: number): Record<number, number> {
  return {
    5: 4 + singularity * 1.5,
    4: 16 + singularity * 2,
    3: 42,
    2: Math.max(8, 22 - singularity * 2),
    1: Math.max(4, 16 - singularity * 2), // includes 0★
  };
}

const tier = (r: number) => Math.max(1, r);

/**
 * Returns `count` distinct servant ids. First rolls a rarity, then a servant
 * of that rarity, so a big roster doesn't skew the odds.
 * Results may match party members (→ NP level up).
 */
export function rollGacha(rng: Rng, singularity: number, count = 3, opts: { maxRarity?: number } = {}): string[] {
  const pool = GACHA_POOL.filter((s) => s.rarity <= (opts.maxRarity ?? 5));
  const weights = rarityWeights(singularity);
  const result: string[] = [];
  let guard = 0;
  while (result.length < count && result.length < pool.length && guard++ < 200) {
    const available = pool.filter((s) => !result.includes(s.id));
    const tiers = [...new Set(available.map((s) => tier(s.rarity)))];
    const r = rng.weighted(tiers.map((t) => ({ item: t, weight: weights[t] ?? 1 })));
    result.push(rng.pick(available.filter((s) => tier(s.rarity) === r)).id);
  }
  return result;
}
