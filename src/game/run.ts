// ─────────────────────────────────────────────────────────────
//  Run flow: map → nodes → rewards. Every function mutates the
//  RunState it receives (the store clones it beforehand).
// ─────────────────────────────────────────────────────────────
import { CRAFT_ESSENCES } from '@/data/craftEssences';
import { CHALDEA_UNIFORM } from '@/data/mysticCodes';
import { getServant, hasServant } from '@/data/servants';
import { SINGULARITIES } from '@/data/singularities';
import { GACHA_SEAL_CHANCE, LEVEL_CAPS, MAX_COMMAND_SEALS, MAX_PARTY, expToNext } from './constants';
import { activateMasterSkill, battleOutcome, createBattle } from './combat/battle';
import { ceFor, generateEncounter } from './combat/factory';
import { availableNodes, generateMap } from './map/generator';
import { rollGacha } from './progression/gacha';
import { ascend, canAscend, gainExp, statsFor } from './progression/leveling';
import { Rng } from './rng';
import type { BattleKind, RunState, ServantInstance } from './types';

export const RUN_VERSION = 2;
const START_LEVEL = 5;

/** Runs `fn` with an Rng bound to the run's RNG state and stores the new state. */
export function withRng<T>(run: RunState, fn: (rng: Rng) => T): T {
  const rng = new Rng(run.rngState);
  const out = fn(rng);
  run.rngState = rng.state;
  return out;
}

function makeInstance(run: RunState, defId: string, level: number, ascension = 0): ServantInstance {
  const inst: ServantInstance = {
    uid: `s${run.uidCounter++}`, defId, level, exp: 0, ascension, npLevel: 1, hp: 0, np: 0, ce: null,
  };
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
    ces: [],
    crystals: 0,
    commandSeals: MAX_COMMAND_SEALS,
    mysticUsed: CHALDEA_UNIFORM.skills.map(() => false),
    uidCounter: 0,
    gachaOptions: [],
    gachaSeal: false,
    starterOptions: rollGacha(rng, 0, 3, { maxRarity: 4 }),
    ceOptions: [],
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
  run.party = [makeInstance(run, defId, START_LEVEL)];
  if (hasServant('mash')) run.party.push(makeInstance(run, 'mash', START_LEVEL));
  run.starterOptions = [];
  run.phase = 'map';
}

// ─── Map ────────────────────────────────────────────────────

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
      withRng(run, (rng) => {
        run.gachaOptions = rollGacha(rng, run.singularity, 3);
        run.gachaSeal = run.commandSeals < MAX_COMMAND_SEALS && rng.chance(GACHA_SEAL_CHANCE);
      });
      if (run.gachaSeal) run.commandSeals++;
      run.phase = 'gacha';
      break;
    case 'rest':
      run.phase = 'rest';
      break;
    case 'treasure':
      openTreasure(run);
      break;
  }
}

function startBattle(run: RunState, kind: BattleKind, layer: number) {
  withRng(run, (rng) => {
    const waves = generateEncounter(rng, run.singularity, layer, kind);
    run.battle = createBattle(rng, run.party, waves, kind, (inst) => ceFor(inst, run.ces));
  });
  run.phase = 'battle';
}

// ─── Mystic Code (once per Singularity) ─────────────────────

export function useMysticCode(run: RunState, idx: number, allyKey?: string): boolean {
  if (!run.battle || run.mysticUsed[idx]) return false;
  const ok = withRng(run, (rng) => activateMasterSkill(run.battle!, rng, idx, allyKey));
  if (ok) run.mysticUsed[idx] = true;
  return ok;
}

// ─── Battle end ─────────────────────────────────────────────

/** Call once battle.status is 'won' or 'lost'. */
export function resolveBattle(run: RunState) {
  const b = run.battle;
  if (!b || b.status === 'player') return;
  run.stats.battles++;
  run.stats.turns += b.turn;

  const outcome = battleOutcome(b, (uid) => {
    const p = run.party.find((x) => x.uid === uid);
    return p ? statsFor(p).maxHp : 0;
  });
  for (const p of run.party) {
    if (outcome[p.uid]) { p.hp = outcome[p.uid].hp; p.np = outcome[p.uid].np; }
  }

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

const nodeType = (run: RunState) => (run.currentNode ? run.map.nodes[run.currentNode].type : null);

export function continueFromResult(run: RunState) {
  if (run.phase !== 'battleResult') return;
  run.lastReward = null;
  const t = nodeType(run);
  if (t === 'elite' || t === 'boss') {
    offerCraftEssences(run);
    return;
  }
  run.phase = 'map';
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
  run.mysticUsed = run.mysticUsed.map(() => false);
  // Chaldea restores the whole party between Singularities (Command Seals do NOT come back)
  for (const p of run.party) p.hp = statsFor(p).maxHp;
  run.phase = 'map';
}

// ─── Craft Essences ─────────────────────────────────────────

function rollCraftEssences(run: RunState, count = 3): string[] {
  return withRng(run, (rng) => {
    const s = run.singularity;
    const out: string[] = [];
    while (out.length < count) {
      const rarity = rng.weighted([
        { item: 5, weight: 10 + s * 3 },
        { item: 4, weight: 35 },
        { item: 3, weight: Math.max(15, 55 - s * 4) },
      ]);
      const pool = CRAFT_ESSENCES.filter((c) => c.rarity === rarity && !out.includes(c.id));
      if (pool.length) out.push(rng.pick(pool).id);
    }
    return out;
  });
}

function offerCraftEssences(run: RunState) {
  run.ceOptions = rollCraftEssences(run);
  run.phase = 'ceReward';
}

/** Picks a Craft Essence reward (or null to skip). */
export function chooseCraftEssence(run: RunState, defId: string | null) {
  if (run.phase !== 'ceReward') return;
  if (defId && run.ceOptions.includes(defId)) run.ces.push({ uid: `ce${run.uidCounter++}`, defId });
  run.ceOptions = [];
  run.treasureText = null;
  run.phase = nodeType(run) === 'boss' ? 'singularityClear' : 'map';
}

/** Equips a CE on a servant (moving it from whoever had it). null unequips. */
export function equipCraftEssence(run: RunState, servantUid: string, ceUid: string | null) {
  if (run.phase === 'battle') return;
  const p = run.party.find((x) => x.uid === servantUid);
  if (!p) return;
  if (ceUid) for (const other of run.party) if (other.ce === ceUid) other.ce = null;
  p.ce = ceUid;
}

// ─── Summon ─────────────────────────────────────────────────

function partyAverageLevel(run: RunState): number {
  if (!run.party.length) return START_LEVEL;
  return Math.round(run.party.reduce((s, p) => s + p.level, 0) / run.party.length);
}

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
  run.gachaSeal = false;
  run.phase = 'map';
  return outcome === 'needsReplace' ? 'joined' : outcome;
}

export function skipGacha(run: RunState) {
  if (run.phase !== 'gacha') return;
  run.gachaOptions = [];
  run.gachaSeal = false;
  run.phase = 'map';
}

// ─── Rest ───────────────────────────────────────────────────

export function rest(run: RunState, choice: 'heal' | 'train') {
  if (run.phase !== 'rest') return;
  for (const p of run.party) {
    if (choice === 'heal') p.hp = statsFor(p).maxHp; // also revives the fallen
    else if (p.hp > 0) gainExp(p, expToNext(p.level) * 2 + expToNext(p.level + 1));
  }
  run.phase = 'map';
}

// ─── Treasure ───────────────────────────────────────────────

function openTreasure(run: RunState) {
  const roll = withRng(run, (rng) =>
    rng.weighted([
      { item: 'ce', weight: 35 },
      { item: 'crystal', weight: 25 },
      { item: 'exp', weight: 22 },
      { item: 'heal', weight: 18 },
    ]),
  );
  if (roll === 'ce') {
    run.treasureText = 'A Craft Essence lies among the ruins. Choose one.';
    offerCraftEssences(run);
    return;
  }
  switch (roll) {
    case 'crystal':
      run.crystals++;
      run.treasureText = 'You find an Ascension Crystal on a forgotten altar. (+1 ◆)';
      break;
    case 'exp':
      for (const p of run.party) if (p.hp > 0) gainExp(p, expToNext(p.level) + expToNext(p.level + 1));
      run.treasureText = 'A pile of Embers (EXP). Every living Servant gains about 2 levels.';
      break;
    default:
      for (const p of run.party) {
        const max = statsFor(p).maxHp;
        p.hp = p.hp > 0 ? Math.min(max, p.hp + Math.round(max * 0.4)) : Math.round(max * 0.2);
      }
      run.treasureText = 'A spring of pure mana. The party recovers 40% HP (the fallen return with 20%).';
  }
  run.phase = 'treasure';
}

export function closeTreasure(run: RunState) {
  if (run.phase !== 'treasure') return;
  run.treasureText = null;
  run.phase = 'map';
}

// ─── Party management ───────────────────────────────────────

export function ascendServant(run: RunState, uid: string): boolean {
  const p = run.party.find((x) => x.uid === uid);
  if (!p || !canAscend(p, run.crystals) || run.phase === 'battle') return false;
  run.crystals -= ascend(p);
  return true;
}

/** Moves a servant within the formation (0–2 = front line). */
export function moveServant(run: RunState, uid: string, toIndex: number) {
  if (run.phase === 'battle') return;
  const idx = run.party.findIndex((p) => p.uid === uid);
  if (idx < 0) return;
  const [p] = run.party.splice(idx, 1);
  run.party.splice(Math.max(0, Math.min(run.party.length, toIndex)), 0, p);
}

/** Command Seal outside battle: revives a servant with 50% HP. */
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
