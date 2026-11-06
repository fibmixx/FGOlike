// Simulador headless para balancear: juega N partidas con una IA sencilla.
// Uso:  npx tsx scripts/simulate.ts [partidas=50]
import { getServant } from '../src/data/servants';
import { SINGULARITIES } from '../src/data/singularities';
import {
  aliveFront, executeTurn, npReady, skillNeedsAlly, toggleSelect, activateSkill,
} from '../src/game/combat/battle';
import { availableNodes } from '../src/game/map/generator';
import { canAscend } from '../src/game/progression/leveling';
import { Rng } from '../src/game/rng';
import {
  ascendServant, chooseStarter, closeTreasure, continueFromResult, enterNode, nextSingularity,
  newRun, recruit, resolveBattle, rest, withRng,
} from '../src/game/run';
import type { RunState } from '../src/game/types';

function autoBattle(run: RunState) {
  const b = run.battle!;
  let guard = 0;
  while (b.status === 'player' && guard++ < 200) {
    // Usa todas las skills disponibles (aliado objetivo = el de menor vida)
    for (const a of aliveFront(b)) {
      a.cooldowns.forEach((cd, i) => {
        if (cd !== 0) return;
        const sk = getServant(a.defId).skills[i];
        const ally = skillNeedsAlly(sk)
          ? [...aliveFront(b)].sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp)[0].key
          : undefined;
        activateSkill(b, a.key, i, ally);
      });
    }
    // NPs primero, luego cartas priorizando Brave chain del Servant con más cartas
    for (const a of aliveFront(b)) if (npReady(b, a.key)) toggleSelect(b, `np:${a.key}`);
    const counts = new Map<string, number>();
    b.hand.forEach((c) => counts.set(c.owner, (counts.get(c.owner) ?? 0) + 1));
    const sorted = [...b.hand].sort((x, y) => (counts.get(y.owner)! - counts.get(x.owner)!) || (y.stars - x.stars));
    for (const c of sorted) if (b.selected.length < 3) toggleSelect(b, c.id);
    withRng(run, (rng) => executeTurn(b, rng));
  }
  resolveBattle(run);
}

function playRun(seed: number) {
  const run = newRun(seed);
  chooseStarter(run, run.starterOptions[0]);
  const rng = new Rng(seed ^ 0xabc);
  let guard = 0;
  while (guard++ < 500) {
    for (const p of run.party) while (canAscend(p, run.crystals)) ascendServant(run, p.uid);
    switch (run.phase) {
      case 'map': {
        const opts = availableNodes(run.map, run.currentNode);
        // Preferencia: rest si hay heridos, gacha si equipo < 6
        const hurt = run.party.some((p) => p.hp <= 0);
        const pref = opts.find((id) => run.map.nodes[id].type === (hurt ? 'rest' : run.party.length < 6 ? 'gacha' : 'treasure'));
        enterNode(run, pref ?? rng.pick(opts));
        break;
      }
      case 'battle': {
        const b = run.battle!;
        if (b.kind === 'boss' && VERBOSE) {
          const boss = b.enemies.find((e) => e.boss)!;
          const lv = run.party.map((p) => p.level).join('/');
          const hpBefore = run.party.map((p) => p.hp).reduce((a, c) => a + c, 0);
          autoBattle(run);
          console.log(`  [${SINGULARITIES[run.singularity].code}] equipo ${lv} vs ${boss.name} L${boss.level} HP${boss.maxHp} ATK${boss.atk} → ${run.phase} (${b.turn} turnos, hp equipo ${hpBefore})`);
        } else autoBattle(run);
        break;
      }
      case 'battleResult': continueFromResult(run); break;
      case 'gacha': {
        const pick = run.gachaOptions[0];
        const weakest = [...run.party].sort((a, b) => a.level - b.level)[0];
        recruit(run, pick, weakest.uid);
        break;
      }
      case 'rest': rest(run, run.party.some((p) => p.hp < 0.6 * 9999) ? 'heal' : 'train'); break;
      case 'treasure': closeTreasure(run); break;
      case 'singularityClear': nextSingularity(run); break;
      case 'gameover':
      case 'victory':
        return run;
    }
  }
  return run;
}

const N = Number(process.argv[2] ?? 50);
const VERBOSE = process.argv.includes('-v');
const reached = new Array(SINGULARITIES.length + 1).fill(0);
let wins = 0;
const levels: number[] = [];
const deaths: Record<string, number> = {};
for (let i = 0; i < N; i++) {
  const run = playRun(1000 + i);
  const s = run.phase === 'victory' ? SINGULARITIES.length : run.singularity;
  reached[s]++;
  if (run.phase === 'victory') wins++;
  else if (run.currentNode) {
    const n = run.map.nodes[run.currentNode];
    const k = `${SINGULARITIES[run.singularity].code}-${n.type}-L${n.layer}`;
    deaths[k] = (deaths[k] ?? 0) + 1;
  }
  levels.push(Math.max(...run.party.map((p) => p.level)));
}
console.log(`Partidas: ${N}  Victorias: ${wins}`);
SINGULARITIES.forEach((s, i) => console.log(`  Muere en ${s.code.padEnd(5)} ${s.name.padEnd(18)} ${reached[i]}`));
console.log(`  Nivel máx. medio al terminar: ${(levels.reduce((a, b) => a + b, 0) / N).toFixed(1)}`);
console.log('  Muertes por nodo:', Object.entries(deaths).sort((a, b) => b[1] - a[1]).slice(0, 8));
