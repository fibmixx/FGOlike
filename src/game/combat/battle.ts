// ─────────────────────────────────────────────────────────────
//  Turn-based battle state machine (FGO rules).
//
//  Player turn:  skills / Mystic Code → pick 3 cards → beginTurn()
//  Resolution:   stepTurn() pops one step at a time from `queue`
//                (card 1, card 2, card 3, chain bonus, extra, enemy actions…)
//                so the UI can animate each one. executeTurn() runs them all.
// ─────────────────────────────────────────────────────────────
import { CHALDEA_UNIFORM } from '@/data/mysticCodes';
import { getServant } from '@/data/servants';
import { BUFF_LABEL, MAX_NP, MAX_STARS, NP_CARRY_OVER, POSITION_MOD } from '../constants';
import type { Rng } from '../rng';
import {
  DEBUFFS, type AllyUnit, type BattleKind, type BattleState, type ChainCard, type CraftEssenceDef,
  type Effect, type EnemyUnit, type FxEvent, type HandCard, type ServantInstance, type SkillDef,
  type TargetSpec, type TurnStep, type Unit,
} from '../types';
import { buffSum, computeDamage, computeNpGain, computeStarGen, hasBuff } from './damage';
import { makeAlly } from './factory';

// ─── Setup ──────────────────────────────────────────────────

export function createBattle(
  rng: Rng, party: ServantInstance[], waves: EnemyUnit[][], kind: BattleKind,
  ceOf: (inst: ServantInstance) => CraftEssenceDef | undefined = () => undefined,
): BattleState {
  const alive = party.filter((p) => p.hp > 0).map((p) => makeAlly(p, ceOf(p)));
  const s: BattleState = {
    kind, waves, waveIndex: 0, enemies: waves[0],
    front: alive.slice(0, 3), back: alive.slice(3), fallen: [],
    deck: [], hand: [], selected: [], stars: 0, turn: 1, target: 0,
    status: 'player', phase: 'select', queue: [], chain: null,
    acting: null, actingCard: null, banner: null,
    log: [], fx: [], fxCounter: 0, cardCounter: 0,
  };
  log(s, `— Wave 1/${waves.length} —`);
  s.front.forEach((a) => enterField(s, a));
  dealHand(s, rng);
  return s;
}

/** Applies class passives and Craft Essence effects once, when a unit first takes the field. */
function enterField(s: BattleState, a: AllyUnit) {
  if (a.entered) return;
  a.entered = true;
  for (const src of a.onEnter) applyEffects(s, a, src.effects, a.key, undefined, src.source);
}

// ─── Helpers ────────────────────────────────────────────────

function log(s: BattleState, msg: string) {
  s.log.push(msg);
  if (s.log.length > 80) s.log.splice(0, s.log.length - 80);
}

function fx(s: BattleState, target: string, kind: FxEvent['kind'], text: string) {
  s.fx.push({ id: s.fxCounter++, target, kind, text });
}

export const aliveEnemies = (s: BattleState) => s.enemies.filter((e) => e.hp > 0);
export const aliveFront = (s: BattleState) => s.front.filter((a) => a.hp > 0);

export function currentTarget(s: BattleState): EnemyUnit | undefined {
  const t = s.enemies[s.target];
  if (t && t.hp > 0) return t;
  const idx = s.enemies.findIndex((e) => e.hp > 0);
  if (idx >= 0) s.target = idx;
  return s.enemies[idx];
}

export function setTarget(s: BattleState, idx: number) {
  if (s.enemies[idx]?.hp > 0) s.target = idx;
}

function rebuildDeck(s: BattleState, rng: Rng) {
  s.deck = rng.shuffle(aliveFront(s).flatMap((a) => deckOf(a).map((type) => ({ owner: a.key, type }))));
}

const deckOf = (a: AllyUnit) => getServant(a.defId).deck;

function dealHand(s: BattleState, rng: Rng) {
  const aliveKeys = new Set(aliveFront(s).map((a) => a.key));
  s.deck = s.deck.filter((c) => aliveKeys.has(c.owner));
  if (s.deck.length < 5) rebuildDeck(s, rng);

  const drawn = s.deck.splice(0, 5);
  s.hand = drawn.map<HandCard>((c) => ({ id: `c${s.cardCounter++}`, owner: c.owner, type: c.type, stars: 0 }));

  // Critical stars: absorption weight + random bonus, max 10 per card
  const bonus = rng.shuffle([50, 20, 20, 0, 0]);
  const weights = s.hand.map((c, i) => {
    const owner = s.front.find((a) => a.key === c.owner)!;
    return owner.starAbsorb * (1 + buffSum(owner, 'starAbsorbUp')) + (bonus[i] ?? 0);
  });
  let n = Math.min(s.stars, MAX_STARS);
  while (n-- > 0) {
    const opts = s.hand.map((c, i) => ({ item: i, weight: c.stars < 10 ? weights[i] : 0 }));
    if (opts.every((o) => o.weight === 0)) break;
    s.hand[rng.weighted(opts)].stars++;
  }
  s.stars = 0;
  s.selected = [];
}

// ─── Effects ────────────────────────────────────────────────

function resolveTargets(s: BattleState, source: Unit, spec: TargetSpec, allyKey?: string): Unit[] {
  switch (spec) {
    case 'self': return [source];
    case 'ally': return [aliveFront(s).find((a) => a.key === allyKey) ?? source];
    case 'allies': return aliveFront(s);
    case 'others': return aliveFront(s).filter((a) => a.key !== source.key);
    case 'enemy': { const t = currentTarget(s); return t ? [t] : []; }
    case 'enemies': return aliveEnemies(s);
  }
}

const BINARY = new Set(['evade', 'invincible', 'taunt', 'stun']);

export function applyEffects(
  s: BattleState, source: Unit, effects: Effect[], allyKey?: string, rng?: Rng, sourceName = source.name,
) {
  for (const ef of effects) {
    if (ef.type === 'stars') {
      s.stars = Math.min(MAX_STARS, s.stars + ef.amount);
      fx(s, source.key, 'buff', `+${ef.amount} ★`);
      continue;
    }
    for (const t of resolveTargets(s, source, ef.target, allyKey)) {
      switch (ef.type) {
        case 'buff': {
          if (ef.chance !== undefined && t.side === 'enemy' && rng && !rng.chance(ef.chance)) {
            fx(s, t.key, 'miss', 'MISS');
            break;
          }
          t.buffs.push({
            kind: ef.kind,
            value: BINARY.has(ef.kind) ? 1 : ef.value,
            turns: ef.turns,
            times: ef.times,
            source: sourceName,
          });
          fx(s, t.key, 'buff', BUFF_LABEL[ef.kind]);
          break;
        }
        case 'heal': {
          const amount = Math.round(t.maxHp * ef.amount);
          t.hp = Math.min(t.maxHp, t.hp + amount);
          fx(s, t.key, 'heal', `+${amount}`);
          break;
        }
        case 'np':
          if (t.side === 'ally') {
            t.np = Math.min(MAX_NP, t.np + ef.amount);
            fx(s, t.key, 'np', `NP +${Math.round(ef.amount)}%`);
          }
          break;
        case 'chargeDown':
          if (t.side === 'enemy') {
            if (ef.chance !== undefined && rng && !rng.chance(ef.chance)) break;
            t.charge = Math.max(0, t.charge - ef.amount);
            fx(s, t.key, 'buff', 'Charge ↓');
          }
          break;
        case 'cleanse':
          t.buffs = t.buffs.filter((b) => !DEBUFFS.includes(b.kind));
          fx(s, t.key, 'buff', 'Cleansed');
          break;
        case 'dispel':
          t.buffs = t.buffs.filter((b) => DEBUFFS.includes(b.kind));
          fx(s, t.key, 'buff', 'Buffs removed');
          break;
      }
    }
  }
}

export function skillNeedsAlly(skill: SkillDef): boolean {
  return skill.effects.some((e) => 'target' in e && e.target === 'ally');
}

export function activateSkill(s: BattleState, rng: Rng, key: string, idx: number, allyKey?: string): boolean {
  if (s.status !== 'player' || s.phase !== 'select') return false;
  const unit = aliveFront(s).find((a) => a.key === key);
  if (!unit || unit.cooldowns[idx] !== 0) return false;
  const skill = unit.skills[idx];
  s.fx = [];
  applyEffects(s, unit, skill.effects, allyKey ?? unit.key, rng);
  unit.cooldowns[idx] = skill.cooldown;
  log(s, `${unit.name} uses ${skill.name}.`);
  return true;
}

/** Mystic Code skill (usage limits are handled by the run). */
export function activateMasterSkill(s: BattleState, rng: Rng, idx: number, allyKey?: string): boolean {
  if (s.status !== 'player' || s.phase !== 'select') return false;
  const skill = CHALDEA_UNIFORM.skills[idx];
  const source = aliveFront(s).find((a) => a.key === allyKey) ?? aliveFront(s)[0];
  if (!source) return false;
  s.fx = [];
  applyEffects(s, source, skill.effects, allyKey ?? source.key, rng, 'Master');
  log(s, `Master uses ${skill.name}.`);
  return true;
}

/** Command Seal: NP +100% */
export function commandSealNp(s: BattleState, key: string): boolean {
  const u = aliveFront(s).find((a) => a.key === key);
  if (!u || s.phase !== 'select') return false;
  u.np = Math.min(MAX_NP, u.np + 100);
  fx(s, u.key, 'np', 'NP +100%');
  log(s, `Command Seal! ${u.name}'s NP is charged by 100%.`);
  return true;
}

/** Command Seal: full heal + cleanse */
export function commandSealHeal(s: BattleState, key: string): boolean {
  const u = aliveFront(s).find((a) => a.key === key);
  if (!u || s.phase !== 'select') return false;
  u.hp = u.maxHp;
  u.buffs = u.buffs.filter((b) => !DEBUFFS.includes(b.kind));
  fx(s, u.key, 'heal', 'Full HP');
  log(s, `Command Seal! ${u.name} is fully restored.`);
  return true;
}

// ─── Card selection ─────────────────────────────────────────

export function npReady(s: BattleState, key: string): boolean {
  const u = aliveFront(s).find((a) => a.key === key);
  return !!u && u.np >= 100;
}

export function toggleSelect(s: BattleState, sel: string) {
  if (s.status !== 'player' || s.phase !== 'select') return;
  const i = s.selected.indexOf(sel);
  if (i >= 0) { s.selected.splice(i, 1); return; }
  if (s.selected.length >= 3) return;
  if (sel.startsWith('np:') && !npReady(s, sel.slice(3))) return;
  s.selected.push(sel);
}

function buildChain(s: BattleState): ChainCard[] {
  return s.selected.map((sel) => {
    if (sel.startsWith('np:')) {
      const owner = sel.slice(3);
      const u = s.front.find((a) => a.key === owner)!;
      return { owner, type: u.npDef.card, isNp: true, stars: 0 };
    }
    const c = s.hand.find((h) => h.id === sel)!;
    return { owner: c.owner, type: c.type, isNp: false, stars: c.stars };
  });
}

export function describeChain(s: BattleState): { label: string | null; brave: boolean } {
  const chain = s.chain?.cards ?? buildChain(s);
  if (chain.length < 3) return { label: null, brave: false };
  const types = new Set(chain.map((c) => c.type));
  const brave = chain.every((c) => c.owner === chain[0].owner);
  let label: string | null = null;
  if (types.size === 1) label = `${chain[0].type} Chain`;
  else if (types.size === 3) label = 'Mighty Chain';
  return { label, brave };
}

// ─── Turn resolution (step by step) ─────────────────────────

/** Locks in the 3 selected cards and queues the turn. */
export function beginTurn(s: BattleState): boolean {
  if (s.status !== 'player' || s.phase !== 'select' || s.selected.length !== 3) return false;
  const cards = buildChain(s);
  const types = new Set(cards.map((c) => c.type));
  const mighty = types.size === 3;
  const sameColor = types.size === 1;
  const first = cards[0].type;
  s.chain = {
    cards,
    busterFirst: first === 'Buster' || mighty,
    artsFirst: first === 'Arts' || mighty,
    quickFirst: first === 'Quick' || mighty,
    busterChain: sameColor && first === 'Buster',
    artsChain: sameColor && first === 'Arts',
    quickChain: sameColor && first === 'Quick',
    mighty,
    braveOwner: cards.every((c) => c.owner === cards[0].owner) ? cards[0].owner : null,
    starAcc: 0,
  };
  const used = new Set(s.selected);
  s.hand = s.hand.filter((h) => !used.has(h.id));
  s.selected = [];
  s.phase = 'resolving';
  s.fx = [];
  s.queue = [
    { t: 'card', i: 0 }, { t: 'card', i: 1 }, { t: 'card', i: 2 },
    { t: 'chainBonus' },
    ...(s.chain.braveOwner ? [{ t: 'extra' } as TurnStep] : []),
    { t: 'resolveChain' },
  ];
  if (sameColor) log(s, `${first} Chain!`);
  if (mighty) log(s, 'Mighty Chain!');
  return true;
}

/** Suggested animation time (ms) for the next queued step. */
export function nextStepDelay(s: BattleState): number {
  const st = s.queue[0];
  if (!st) return 0;
  switch (st.t) {
    case 'card': return s.chain?.cards[st.i]?.isNp ? 1300 : 650;
    case 'extra': return 650;
    case 'enemy': {
      const e = s.enemies.find((x) => x.key === st.key);
      return e && e.hp > 0 ? (e.charge >= e.chargeMax ? 1200 : 550) : 0;
    }
    case 'chainBonus': return s.chain && (s.chain.artsChain || s.chain.quickChain) ? 350 : 0;
    case 'resolveChain': return 300;
    default: return 120;
  }
}

/** Executes the next queued step. Returns true while steps remain. */
export function stepTurn(s: BattleState, rng: Rng): boolean {
  if (s.phase !== 'resolving') return false;
  const step = s.queue.shift();
  s.fx = [];
  s.banner = null;
  s.acting = null;
  s.actingCard = null;
  if (!step) { s.phase = 'select'; return false; }
  const c = s.chain!;

  switch (step.t) {
    case 'card': {
      const card = c.cards[step.i];
      const att = aliveFront(s).find((a) => a.key === card.owner);
      if (!att || aliveEnemies(s).length === 0) break;
      s.acting = att.key;
      s.actingCard = step.i;
      if (card.isNp) { c.starAcc += executeNp(s, rng, att); break; }
      const target = currentTarget(s)!;
      const crit = rng.chance(card.stars * 0.1 + buffSum(att, 'critRateUp'));
      const posMod = POSITION_MOD[step.i];
      const dmg = computeDamage(att, target, {
        card: card.type, posMod, busterFirst: c.busterFirst, crit, busterChain: c.busterChain, random: rng.range(0.9, 1.1),
      });
      const hits = att.hits[card.type];
      log(s, `${att.name} · ${card.type}${crit ? ' (Critical!)' : ''} → ${target.name}: ${dmg}`);
      damageUnit(s, target, dmg, crit);
      att.np = Math.min(MAX_NP, att.np + computeNpGain(att, card.type, hits, { posMod, artsFirst: c.artsFirst, crit, isNp: false, isExtra: false }));
      c.starAcc += computeStarGen(att, card.type, hits, { posMod, quickFirst: c.quickFirst, crit, isNp: false, isExtra: false });
      break;
    }
    case 'chainBonus': {
      if (c.artsChain) {
        for (const key of new Set(c.cards.map((x) => x.owner))) {
          const u = aliveFront(s).find((a) => a.key === key);
          if (u) { u.np = Math.min(MAX_NP, u.np + 20); fx(s, u.key, 'np', 'NP +20%'); }
        }
      }
      if (c.quickChain) c.starAcc += 10;
      break;
    }
    case 'extra': {
      const att = aliveFront(s).find((a) => a.key === c.braveOwner);
      const target = currentTarget(s);
      if (!att || !target) break;
      s.acting = att.key;
      s.actingCard = 3;
      log(s, `Brave Chain! ${att.name}'s Extra Attack.`);
      const card = c.busterChain ? 'Buster' : c.cards[0].type;
      const sameColor = c.busterChain || c.artsChain || c.quickChain;
      const dmg = computeDamage(att, target, {
        card, posMod: 1, busterFirst: c.busterFirst, extraMult: sameColor ? 3.5 : 2, crit: false,
        busterChain: c.busterChain, random: rng.range(0.9, 1.1),
      });
      damageUnit(s, target, dmg, false);
      att.np = Math.min(MAX_NP, att.np + computeNpGain(att, card, att.hits.Extra, { posMod: 1, artsFirst: c.artsFirst, crit: false, isNp: false, isExtra: true }));
      c.starAcc += computeStarGen(att, card, att.hits.Extra, { posMod: 1, quickFirst: c.quickFirst, crit: false, isNp: false, isExtra: true });
      break;
    }
    case 'resolveChain': {
      const gained = Math.floor(c.starAcc) + (rng.chance(c.starAcc % 1) ? 1 : 0);
      s.stars = Math.min(MAX_STARS, s.stars + gained);
      if (gained > 0) log(s, `+${gained} critical stars.`);
      if (aliveEnemies(s).length === 0) {
        if (s.waveIndex + 1 < s.waves.length) {
          s.waveIndex++;
          s.enemies = s.waves[s.waveIndex];
          s.target = 0;
          log(s, `— Wave ${s.waveIndex + 1}/${s.waves.length} —`);
          s.banner = `Wave ${s.waveIndex + 1}/${s.waves.length}`;
          s.queue = [{ t: 'endTurn' }];
        } else {
          s.status = 'won';
          s.phase = 'select';
          s.queue = [];
          log(s, 'Victory!');
          return false;
        }
      } else {
        for (const e of s.enemies) {
          if (e.hp <= 0) continue;
          e.justNp = false;
          for (let n = 0; n < e.actions; n++) s.queue.push({ t: 'enemy', key: e.key, n });
        }
        s.queue.push({ t: 'enemyCharge' }, { t: 'endTurn' });
      }
      break;
    }
    case 'enemy': {
      const e = s.enemies.find((x) => x.key === step.key);
      if (!e || e.hp <= 0 || aliveFront(s).length === 0) break;
      if (hasBuff(e, 'stun')) {
        if (step.n === 0) { log(s, `${e.name} is stunned.`); fx(s, e.key, 'miss', 'STUNNED'); }
        break;
      }
      s.acting = e.key;
      enemyAction(s, rng, e);
      break;
    }
    case 'enemyCharge':
      for (const e of aliveEnemies(s)) {
        if (!e.justNp && !hasBuff(e, 'stun')) e.charge = Math.min(e.chargeMax, e.charge + 1);
        e.justNp = false;
      }
      break;
    case 'endTurn':
      endTurn(s, rng);
      return false;
  }

  if (aliveFront(s).length === 0 && s.back.length === 0 && s.queue.length && s.queue[0].t !== 'endTurn') {
    s.queue = [{ t: 'endTurn' }];
  }
  return s.queue.length > 0;
}

/** Runs the whole turn at once (simulator / tests). */
export function executeTurn(s: BattleState, rng: Rng): void {
  if (!beginTurn(s)) return;
  let guard = 0;
  while (s.phase === 'resolving' && guard++ < 200) {
    if (!stepTurn(s, rng) && s.phase === 'resolving' && !s.queue.length) s.phase = 'select';
  }
}

/** Finishes the current turn instantly (UI "skip"). */
export function finishTurn(s: BattleState, rng: Rng): void {
  let guard = 0;
  while (s.phase === 'resolving' && guard++ < 200) stepTurn(s, rng);
}

// ─── Combat internals ───────────────────────────────────────

function damageUnit(s: BattleState, target: Unit, dmg: number, crit: boolean) {
  target.hp -= dmg;
  fx(s, target.key, crit ? 'crit' : 'damage', crit ? `${dmg}!` : `${dmg}`);
  if (target.hp > 0) return;

  const guts = target.buffs.find((b) => b.kind === 'guts' && (b.times === undefined || b.times > 0));
  if (guts) {
    target.hp = Math.max(1, Math.round(target.maxHp * guts.value));
    target.buffs = target.buffs.filter((b) => b !== guts);
    fx(s, target.key, 'buff', 'GUTS!');
    log(s, `${target.name} refuses to fall! (Guts)`);
    return;
  }
  if (target.side === 'enemy' && target.phases.length) {
    const ph = target.phases.shift()!;
    target.maxHp = ph.hp;
    target.hp = ph.hp;
    target.buffs = target.buffs.filter((b) => !DEBUFFS.includes(b.kind));
    if (ph.npName) target.npName = ph.npName;
    if (ph.npMult) target.npMult = ph.npMult;
    if (ph.actions) target.actions = ph.actions;
    if (ph.fullCharge) target.charge = target.chargeMax;
    applyEffects(s, target, ph.effects ?? [], undefined, undefined, 'Phase');
    s.banner = `BREAK! ${ph.text}`;
    fx(s, target.key, 'np', 'BREAK');
    log(s, `⚡ ${target.name} — ${ph.text}`);
    return;
  }
  target.hp = 0;
  log(s, target.side === 'enemy' ? `${target.name} is defeated.` : `${target.name} has fallen.`);
}

function executeNp(s: BattleState, rng: Rng, att: AllyUnit): number {
  const npDef = att.npDef;
  const oc = Math.max(1, Math.min(3, Math.floor(att.np / 100)));
  att.np = 0;
  log(s, `✦ ${att.name}: ${npDef.name}${oc > 1 ? ` (OC ${oc * 100}%)` : ''}`);
  s.banner = npDef.name;
  fx(s, att.key, 'np', npDef.name);

  applyEffects(s, att, npDef.pre ?? [], att.key, rng);
  let stars = 0;
  if (npDef.kind !== 'support') {
    const mult = npDef.multiplier * (1 + 0.1 * (oc - 1));
    const t0 = currentTarget(s);
    const targets = npDef.kind === 'single' ? (t0 ? [t0] : []) : aliveEnemies(s);
    for (const t of targets) {
      const dmg = computeDamage(att, t, {
        card: npDef.card, posMod: 1, busterFirst: false, npMult: mult, crit: false, busterChain: false,
        random: rng.range(0.9, 1.1),
      });
      damageUnit(s, t, dmg, false);
      att.np = Math.min(MAX_NP, att.np + computeNpGain(att, npDef.card, npDef.hits, { posMod: 1, artsFirst: false, crit: false, isNp: true, isExtra: false }));
      stars += computeStarGen(att, npDef.card, npDef.hits, { posMod: 1, quickFirst: false, crit: false, isNp: true, isExtra: false });
    }
  }
  applyEffects(s, att, npDef.post ?? [], att.key, rng);
  return stars;
}

function pickAllyTarget(s: BattleState, rng: Rng): AllyUnit | undefined {
  const alive = aliveFront(s);
  const taunters = alive.filter((a) => hasBuff(a, 'taunt'));
  return taunters.length ? rng.pick(taunters) : alive.length ? rng.pick(alive) : undefined;
}

function hitAlly(s: BattleState, ally: AllyUnit, dmg: number) {
  const block = ally.buffs.find((b) => b.kind === 'invincible' || b.kind === 'evade');
  if (block) {
    if (block.times !== undefined) block.times--;
    if (block.times === 0) ally.buffs = ally.buffs.filter((b) => b !== block);
    fx(s, ally.key, 'miss', block.kind === 'invincible' ? 'INVINCIBLE' : 'EVADE');
    return;
  }
  damageUnit(s, ally, dmg, false);
  ally.np = Math.min(MAX_NP, ally.np + ally.npDefRate * (1 + buffSum(ally, 'npGainUp')));
  // Damage cut with limited uses
  const cut = ally.buffs.find((b) => b.kind === 'dmgCut' && b.times !== undefined);
  if (cut) { cut.times!--; if (cut.times! <= 0) ally.buffs = ally.buffs.filter((b) => b !== cut); }
}

function enemyAction(s: BattleState, rng: Rng, enemy: EnemyUnit) {
  if (enemy.charge >= enemy.chargeMax) {
    log(s, `⚠ ${enemy.name} unleashes ${enemy.npName}!`);
    s.banner = enemy.npName;
    const targets = enemy.npAoe ? aliveFront(s) : [pickAllyTarget(s, rng)!];
    for (const t of targets) {
      const dmg = computeDamage(enemy, t, {
        card: 'Arts', posMod: 1, busterFirst: false, npMult: enemy.npMult, crit: false, busterChain: false,
        random: rng.range(0.9, 1.1),
      });
      hitAlly(s, t, dmg);
    }
    enemy.charge = 0;
    enemy.justNp = true;
    return;
  }
  const t = pickAllyTarget(s, rng);
  if (!t) return;
  const card = rng.pick<'Buster' | 'Arts' | 'Quick'>(['Buster', 'Arts', 'Quick']);
  const crit = rng.chance(0.06);
  const dmg = computeDamage(enemy, t, { card, posMod: 1, busterFirst: false, crit, busterChain: false, random: rng.range(0.9, 1.1) });
  hitAlly(s, t, dmg);
}

function tickBuffs(u: Unit) {
  u.buffs = u.buffs.filter((b) => {
    if (b.times !== undefined && b.times <= 0) return false;
    if (b.turns < 0) return true;
    b.turns--;
    return b.turns > 0;
  });
}

function endTurn(s: BattleState, rng: Rng) {
  for (const a of aliveFront(s)) {
    const regen = buffSum(a, 'regen');
    if (regen > 0) {
      const amt = Math.round(a.maxHp * regen);
      a.hp = Math.min(a.maxHp, a.hp + amt);
      fx(s, a.key, 'heal', `+${amt}`);
    }
    const npRegen = buffSum(a, 'npRegen');
    if (npRegen > 0) a.np = Math.min(MAX_NP, a.np + npRegen);
    const starRegen = buffSum(a, 'starRegen');
    if (starRegen > 0) s.stars = Math.min(MAX_STARS, s.stars + Math.round(starRegen));
    a.cooldowns = a.cooldowns.map((c) => (c === null ? null : Math.max(0, c - 1)));
  }
  // Damage over time (burn / poison / curse)
  for (const u of [...aliveFront(s), ...aliveEnemies(s)]) {
    const dot = buffSum(u, 'dot');
    if (dot > 0) damageUnit(s, u, Math.round(dot), false);
  }
  for (const e of s.enemies) {
    const regen = buffSum(e, 'regen');
    if (e.hp > 0 && regen > 0) e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * regen));
  }
  [...s.front, ...s.enemies].forEach(tickBuffs);

  if (aliveEnemies(s).length === 0) {
    // DoT finished the wave
    if (s.waveIndex + 1 < s.waves.length) {
      s.waveIndex++;
      s.enemies = s.waves[s.waveIndex];
      s.target = 0;
      log(s, `— Wave ${s.waveIndex + 1}/${s.waves.length} —`);
    } else {
      s.status = 'won';
      s.phase = 'select';
      s.queue = [];
      log(s, 'Victory!');
      return;
    }
  }

  // Automatic substitution of fallen servants
  const before = s.front.map((a) => a.key).join();
  s.front = s.front.map((a) => {
    if (a.hp > 0) return a;
    s.fallen.push(a);
    const sub = s.back.shift();
    if (sub) { log(s, `${sub.name} enters the battle.`); enterField(s, sub); }
    return sub as AllyUnit;
  }).filter(Boolean);
  if (before !== s.front.map((a) => a.key).join()) s.deck = [];

  s.phase = 'select';
  s.queue = [];
  s.chain = null;
  if (aliveFront(s).length === 0) {
    s.hand = [];
    s.status = 'lost';
    log(s, 'Your whole party has fallen…');
    return;
  }
  s.turn++;
  dealHand(s, rng);
}

/** HP and carried-over NP of each servant after the battle. */
export function battleOutcome(s: BattleState, baseMaxHp: (uid: string) => number): Record<string, { hp: number; np: number }> {
  const out: Record<string, { hp: number; np: number }> = {};
  for (const u of [...s.front, ...s.back, ...s.fallen]) {
    const hp = Math.max(0, Math.min(u.hp, baseMaxHp(u.key)));
    out[u.key] = { hp, np: hp > 0 ? Math.floor(Math.min(100, u.np) * NP_CARRY_OVER) : 0 };
  }
  return out;
}
