// ─────────────────────────────────────────────────────────────
//  Lógica de la partida (run): mapa → nodos → recompensas.
//  Todas las funciones mutan el RunState recibido (el store clona antes).
// ─────────────────────────────────────────────────────────────
import { getServant } from '@/data/servants';
import { SINGULARITIES } from '@/data/singularities';
import { LEVEL_CAPS, MAX_COMMAND_SEALS, MAX_PARTY, expToNext } from './constants';
import { battleHpByUid, createBattle } from './combat/battle';
import { generateEncounter } from './combat/factory';
import { availableNodes, generateMap } from './map/generator';
import { rollGacha } from './progression/gacha';
import { ascend, canAscend, gainExp, statsFor } from './progression/leveling';
import { Rng } from './rng';
import type { BattleKind, RunState, ServantInstance } from './types';

export const RUN_VERSION = 1;
const START_LEVEL = 5;

/** Ejecuta `fn` con un Rng ligado al estado de la run y guarda el estado resultante. */
export function withRng<T>(run: RunState, fn: (rng: Rng) => T): T {
  const rng = new Rng(run.rngState);
  const out = fn(rng);
  run.rngState = rng.state;
  return out;
}

function makeInstance(run: RunState, defId: string, level: number, ascension = 0): ServantInstance {
  const inst: ServantInstance = { uid: `s${run.uidCounter++}`, defId, level, exp: 0, ascension, npLevel: 1, hp: 0 };
  inst.hp = statsFor(inst).maxHp;
  return inst;
}

export function newRun(seed: number): RunState {
  const rng = new Rng(seed);
  const run: RunState = {
    version: RUN_VERSION,
    seed,
    rngState: seed,
    phase: 'starter',
    singularity: 0,
    map: generateMap(rng, 0),
    currentNode: null,
    party: [],
    crystals: 0,
    commandSeals: MAX_COMMAND_SEALS,
    uidCounter: 0,
    gachaOptions: [],
    starterOptions: rollGacha(rng, 0, 3, { maxRarity: 4 }),
    battle: null,
    lastReward: null,
    treasureText: null,
    stats: { battles: 0, turns: 0, recruits: 0, startedAt: Date.now() },
  };
  run.rngState = rng.state;
  return run;
}

export function chooseStarter(run: RunState, defId: string) {
  if (run.phase !== 'starter' || !run.starterOptions.includes(defId)) return;
  run.party = [makeInstance(run, defId, START_LEVEL), makeInstance(run, 'mash', START_LEVEL)];
  run.starterOptions = [];
  run.phase = 'map';
}

// ─── Mapa ────────────────────────────────────────────────────

export function canEnter(run: RunState, nodeId: string): boolean {
  return run.phase === 'map' && availableNodes(run.map, run.currentNode).includes(nodeId);
}

export function enterNode(run: RunState, nodeId: string) {
  if (!canEnter(run, nodeId)) return;
  const node = run.map.nodes[nodeId];
  node.visited = true;
  run.currentNode = nodeId;

  switch (node.type) {
    case 'battle':
    case 'elite':
    case 'boss':
      startBattle(run, node.type, node.layer);
      break;
    case 'gacha':
      run.gachaOptions = withRng(run, (rng) => rollGacha(rng, run.singularity, 3));
      run.phase = 'gacha';
      break;
    case 'rest':
      run.phase = 'rest';
      break;
    case 'treasure':
      openTreasure(run);
      run.phase = 'treasure';
      break;
  }
}

function startBattle(run: RunState, kind: BattleKind, layer: number) {
  withRng(run, (rng) => {
    const waves = generateEncounter(rng, run.singularity, layer, kind);
    run.battle = createBattle(rng, run.party, waves, kind);
  });
  run.phase = 'battle';
}

// ─── Final de combate ────────────────────────────────────────

/** Llamar cuando battle.status sea 'won' o 'lost'. */
export function resolveBattle(run: RunState) {
  const b = run.battle;
  if (!b || b.status === 'player') return;
  run.stats.battles++;
  run.stats.turns += b.turn;

  const hp = battleHpByUid(b);
  for (const p of run.party) if (p.uid in hp) p.hp = hp[p.uid];

  if (b.status === 'lost') {
    run.phase = 'gameover';
    run.battle = null;
    return;
  }

  const totalLevels = b.waves.flat().reduce((s, e) => s + e.level, 0);
  const mult = b.kind === 'boss' ? 2.2 : b.kind === 'elite' ? 1.6 : 1;
  const exp = Math.round(totalLevels * 5 * mult);
  const frontKeys = new Set(b.front.filter((a) => a.hp > 0).map((a) => a.key));
  const backKeys = new Set(b.back.map((a) => a.key));

  const levelUps: { uid: string; from: number; to: number }[] = [];
  for (const p of run.party) {
    if (p.hp <= 0) continue;
    const amount = frontKeys.has(p.uid) ? exp : backKeys.has(p.uid) ? Math.round(exp / 2) : 0;
    if (!amount) continue;
    const from = gainExp(p, amount);
    if (p.level > from) levelUps.push({ uid: p.uid, from, to: p.level });
  }

  let crystals = b.kind === 'boss' ? 2 : b.kind === 'elite' ? 1 : 0;
  if (b.kind === 'battle' && withRng(run, (rng) => rng.chance(0.12))) crystals++;
  run.crystals += crystals;

  run.lastReward = { exp, crystals, levelUps };
  run.battle = null;
  run.phase = 'battleResult';
}

export function continueFromResult(run: RunState) {
  if (run.phase !== 'battleResult') return;
  const node = run.currentNode ? run.map.nodes[run.currentNode] : null;
  run.lastReward = null;
  run.phase = node?.type === 'boss' ? 'singularityClear' : 'map';
}

export function nextSingularity(run: RunState) {
  if (run.phase !== 'singularityClear') return;
  if (run.singularity >= SINGULARITIES.length - 1) {
    run.phase = 'victory';
    return;
  }
  run.singularity++;
  run.map = withRng(run, (rng) => generateMap(rng, run.singularity));
  run.currentNode = null;
  run.commandSeals = Math.min(MAX_COMMAND_SEALS, run.commandSeals + 1);
  // Chaldea recupera a todo el equipo entre Singularidades
  for (const p of run.party) p.hp = statsFor(p).maxHp;
  run.phase = 'map';
}

// ─── Gacha ───────────────────────────────────────────────────

function partyAverageLevel(run: RunState): number {
  if (!run.party.length) return START_LEVEL;
  return Math.round(run.party.reduce((s, p) => s + p.level, 0) / run.party.length);
}

/** Resultado de elegir un Servant del gacha. */
export type RecruitOutcome = 'joined' | 'npUp' | 'needsReplace' | 'invalid';

export function previewRecruit(run: RunState, defId: string): RecruitOutcome {
  if (!run.gachaOptions.includes(defId)) return 'invalid';
  if (run.party.some((p) => p.defId === defId)) return 'npUp';
  return run.party.length < MAX_PARTY ? 'joined' : 'needsReplace';
}

export function recruit(run: RunState, defId: string, replaceUid?: string): RecruitOutcome {
  if (run.phase !== 'gacha') return 'invalid';
  const outcome = previewRecruit(run, defId);
  if (outcome === 'invalid') return outcome;

  if (outcome === 'npUp') {
    const p = run.party.find((x) => x.defId === defId)!;
    p.npLevel = Math.min(5, p.npLevel + 1);
    p.hp = statsFor(p).maxHp;
  } else {
    if (outcome === 'needsReplace') {
      const idx = run.party.findIndex((p) => p.uid === replaceUid);
      if (idx < 0) return 'needsReplace';
      run.party.splice(idx, 1);
    }
    const avg = partyAverageLevel(run);
    const neededAsc = Math.max(0, LEVEL_CAPS.findIndex((c) => c >= avg));
    const asc = Math.min(neededAsc, Math.ceil(run.singularity / 2));
    const level = Math.min(avg, LEVEL_CAPS[asc]);
    run.party.push(makeInstance(run, defId, Math.max(START_LEVEL, level), asc));
  }
  run.stats.recruits++;
  run.gachaOptions = [];
  run.phase = 'map';
  return outcome === 'needsReplace' ? 'joined' : outcome;
}

export function skipGacha(run: RunState) {
  if (run.phase !== 'gacha') return;
  run.gachaOptions = [];
  run.phase = 'map';
}

// ─── Descanso ────────────────────────────────────────────────

export function rest(run: RunState, choice: 'heal' | 'train') {
  if (run.phase !== 'rest') return;
  for (const p of run.party) {
    if (choice === 'heal') {
      p.hp = statsFor(p).maxHp; // también revive a los caídos
    } else if (p.hp > 0) {
      gainExp(p, expToNext(p.level) * 2 + expToNext(p.level + 1));
    }
  }
  run.phase = 'map';
}

// ─── Tesoro ──────────────────────────────────────────────────

function openTreasure(run: RunState) {
  const roll = withRng(run, (rng) =>
    rng.weighted([
      { item: 'crystal', weight: 32 },
      { item: 'exp', weight: 30 },
      { item: 'seal', weight: run.commandSeals < MAX_COMMAND_SEALS ? 14 : 0 },
      { item: 'heal', weight: 24 },
    ]),
  );
  switch (roll) {
    case 'crystal':
      run.crystals++;
      run.treasureText = 'Encuentras un Cristal de Ascensión entre los restos de un altar. (+1 ◆)';
      break;
    case 'exp':
      for (const p of run.party) if (p.hp > 0) gainExp(p, expToNext(p.level) + expToNext(p.level + 1));
      run.treasureText = 'Un montón de Fuegos Fatuos (EXP). Todo el equipo vivo sube unos 2 niveles.';
      break;
    case 'seal':
      run.commandSeals++;
      run.treasureText = 'Un Fragmento de Hechizo de Comando resuena en tu mano. (+1 Hechizo)';
      break;
    default:
      for (const p of run.party) {
        const max = statsFor(p).maxHp;
        p.hp = p.hp > 0 ? Math.min(max, p.hp + Math.round(max * 0.4)) : Math.round(max * 0.2);
      }
      run.treasureText = 'Un manantial de maná puro. El equipo recupera un 40% de vida (los caídos vuelven con un 20%).';
  }
}

export function closeTreasure(run: RunState) {
  if (run.phase !== 'treasure') return;
  run.treasureText = null;
  run.phase = 'map';
}

// ─── Gestión del equipo ──────────────────────────────────────

export function ascendServant(run: RunState, uid: string): boolean {
  const p = run.party.find((x) => x.uid === uid);
  if (!p || !canAscend(p, run.crystals) || run.phase === 'battle') return false;
  run.crystals -= ascend(p);
  return true;
}

/** Mueve un Servant a otra posición de la formación (0–2 = primera línea). */
export function moveServant(run: RunState, uid: string, toIndex: number) {
  if (run.phase === 'battle') return;
  const idx = run.party.findIndex((p) => p.uid === uid);
  if (idx < 0) return;
  const [p] = run.party.splice(idx, 1);
  run.party.splice(Math.max(0, Math.min(run.party.length, toIndex)), 0, p);
}

/** Hechizo de Comando fuera de combate: revive a un Servant con 50% de vida. */
export function sealRevive(run: RunState, uid: string): boolean {
  const p = run.party.find((x) => x.uid === uid);
  if (!p || p.hp > 0 || run.commandSeals <= 0 || run.phase === 'battle') return false;
  run.commandSeals--;
  p.hp = Math.round(statsFor(p).maxHp * 0.5);
  return true;
}

export function servantName(inst: ServantInstance): string {
  return getServant(inst.defId).name;
}
