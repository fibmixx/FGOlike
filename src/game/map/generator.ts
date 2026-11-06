import type { MapData, MapNode, NodeType } from '../types';
import type { Rng } from '../rng';

/**
 * Fixed diamond lattice (same shape every Singularity, like pokelike):
 *
 *            ♛              boss
 *          ○   ○            row 6  (always Rest)
 *        ○   ○   ○          row 5
 *      ○   ○   ○   ○        row 4
 *        ○   ○   ○          row 3
 *      ○   ○   ○   ○        row 2
 *        ○   ○   ○          row 1  (at least one Summon)
 *          ○   ○            row 0  (Battles)
 *            ▲              Rayshift point
 *
 * Going from a row of n to a row of n+1, node i links to i and i+1;
 * from n to n−1, node i links to i−1 and i.
 */
export const MAP_ROWS = [2, 3, 4, 3, 4, 3, 2];
const X_POS: Record<number, number[]> = {
  1: [0.5],
  2: [0.3, 0.7],
  3: [0.18, 0.5, 0.82],
  4: [0.08, 0.36, 0.64, 0.92],
};

export function generateMap(rng: Rng, singularity: number): MapData {
  const rows = [...MAP_ROWS, 1];
  const nodes: Record<string, MapNode> = {};
  const byLayer: MapNode[][] = rows.map((size, layer) =>
    Array.from({ length: size }, (_, i) => {
      const node: MapNode = { id: `n${layer}_${i}`, layer, x: X_POS[size][i], type: 'battle', next: [], visited: false };
      nodes[node.id] = node;
      return node;
    }),
  );

  // Edges
  for (let l = 0; l < rows.length - 1; l++) {
    const cur = byLayer[l];
    const nxt = byLayer[l + 1];
    cur.forEach((n, i) => {
      let targets: number[];
      if (nxt.length === 1) targets = [0];
      else if (nxt.length > cur.length) targets = [i, i + 1];
      else targets = [i - 1, i];
      n.next = targets.filter((t) => t >= 0 && t < nxt.length).map((t) => nxt[t].id);
    });
  }

  assignTypes(rng, byLayer);
  return { singularity, layers: rows.length, nodes, startIds: byLayer[0].map((n) => n.id) };
}

function assignTypes(rng: Rng, byLayer: MapNode[][]) {
  const last = byLayer.length - 1;
  byLayer[last][0].type = 'boss';
  byLayer[last - 1].forEach((n) => (n.type = 'rest'));
  byLayer[0].forEach((n) => (n.type = 'battle'));

  for (let l = 1; l < last - 1; l++) {
    for (const n of byLayer[l]) n.type = pickType(rng, l);
    // never three of the same non-battle type in a row
    const counts: Partial<Record<NodeType, number>> = {};
    for (const n of byLayer[l]) counts[n.type] = (counts[n.type] ?? 0) + 1;
    for (const n of byLayer[l]) {
      if (n.type !== 'battle' && (counts[n.type] ?? 0) > 2) { counts[n.type]!--; n.type = 'battle'; }
    }
  }
  // Guarantees
  if (!byLayer[1].some((n) => n.type === 'gacha')) rng.pick(byLayer[1]).type = 'gacha';
  const mid = byLayer.slice(3, last - 1).flat();
  if (!mid.some((n) => n.type === 'elite')) rng.pick(mid.filter((n) => n.type === 'battle').length ? mid.filter((n) => n.type === 'battle') : mid).type = 'elite';
  const early = byLayer.slice(2, 4).flat();
  if (!early.some((n) => n.type === 'gacha')) rng.pick(early).type = 'gacha';
}

function pickType(rng: Rng, layer: number): NodeType {
  return rng.weighted<NodeType>([
    { item: 'battle', weight: 42 },
    { item: 'gacha', weight: 18 },
    { item: 'treasure', weight: 14 },
    { item: 'rest', weight: layer <= 2 ? 0 : 8 },
    { item: 'elite', weight: layer >= 3 ? 16 : 0 },
  ]);
}

/** Nodes you can move to from the current position. */
export function availableNodes(map: MapData, current: string | null): string[] {
  if (current === null) return map.startIds;
  return map.nodes[current].next;
}
