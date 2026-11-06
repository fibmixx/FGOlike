import type { MapData, MapNode, NodeType } from '../types';
import type { Rng } from '../rng';

/**
 * Genera un mapa por capas estilo Slay the Spire / pokelike:
 *  - capa 0: combates de entrada (2–3 caminos)
 *  - capa 1: siempre hay al menos una Invocación (para reclutar pronto)
 *  - capas intermedias: mezcla ponderada
 *  - penúltima capa: Descanso garantizado
 *  - última capa: Jefe de la Singularidad
 */
export function generateMap(rng: Rng, singularity: number, layers = 8): MapData {
  const nodes: Record<string, MapNode> = {};
  const byLayer: MapNode[][] = [];
  let counter = 0;

  for (let l = 0; l < layers; l++) {
    const isBoss = l === layers - 1;
    const size = isBoss ? 1 : l === 0 ? rng.int(2, 3) : rng.int(2, 4);
    const layer: MapNode[] = [];
    for (let i = 0; i < size; i++) {
      const x = size === 1 ? 0.5 : 0.12 + (0.76 * i) / (size - 1) + rng.range(-0.04, 0.04);
      const node: MapNode = { id: `n${counter++}`, layer: l, x, type: 'battle', next: [], visited: false };
      layer.push(node);
      nodes[node.id] = node;
    }
    byLayer.push(layer);
  }

  // Tipos de nodo
  for (let l = 0; l < layers; l++) {
    const layer = byLayer[l];
    if (l === layers - 1) { layer[0].type = 'boss'; continue; }
    if (l === layers - 2) { layer.forEach((n) => (n.type = 'rest')); continue; }
    if (l === 0) { layer.forEach((n) => (n.type = 'battle')); continue; }
    for (const n of layer) n.type = pickType(rng, l, layers);
    if (l === 1 && !layer.some((n) => n.type === 'gacha')) rng.pick(layer).type = 'gacha';
  }
  // Garantiza al menos un élite en la mitad final (si hay hueco)
  const mid = byLayer.slice(3, layers - 2).flat();
  if (mid.length && !mid.some((n) => n.type === 'elite')) rng.pick(mid).type = 'elite';

  // Conexiones: cada nodo apunta a 1–2 nodos cercanos de la siguiente capa
  for (let l = 0; l < layers - 1; l++) {
    const cur = byLayer[l];
    const nxt = byLayer[l + 1];
    cur.forEach((n, i) => {
      const ratio = cur.length === 1 ? 0.5 : i / (cur.length - 1);
      const base = Math.round(ratio * (nxt.length - 1));
      const targets = new Set([base]);
      if (rng.chance(0.45)) {
        const alt = base + (rng.chance(0.5) ? 1 : -1);
        if (alt >= 0 && alt < nxt.length) targets.add(alt);
      }
      n.next = [...targets].map((t) => nxt[t].id);
    });
    // Todo nodo de la siguiente capa debe ser alcanzable
    nxt.forEach((m, j) => {
      if (!cur.some((n) => n.next.includes(m.id))) {
        const ratio = nxt.length === 1 ? 0.5 : j / (nxt.length - 1);
        const from = cur[Math.round(ratio * (cur.length - 1))];
        from.next.push(m.id);
      }
    });
  }

  return { singularity, layers, nodes, startIds: byLayer[0].map((n) => n.id) };
}

function pickType(rng: Rng, layer: number, layers: number): NodeType {
  const late = layer >= Math.floor(layers / 2);
  return rng.weighted<NodeType>([
    { item: 'battle', weight: 44 },
    { item: 'gacha', weight: 18 },
    { item: 'treasure', weight: 13 },
    { item: 'rest', weight: layer <= 1 ? 0 : 9 },
    { item: 'elite', weight: late ? 14 : 4 },
  ]);
}

/** Nodos disponibles para avanzar desde la posición actual. */
export function availableNodes(map: MapData, current: string | null): string[] {
  if (current === null) return map.startIds;
  return map.nodes[current].next;
}
