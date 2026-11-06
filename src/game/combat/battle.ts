// ─────────────────────────────────────────────────────────────
//  Máquina de estados del combate por turnos (fiel a FGO).
//  Funciones puras sobre un BattleState mutable (el store clona antes).
//
//  Turno del jugador:  skills/Master skills → elegir 3 cartas → ejecutar cadena
//  Cadena:             bonus 1ª carta · Buster/Arts/Quick/Mighty chain · Brave chain (Extra)
//  Turno enemigo:      ataques normales, carga → NP enemigo
//  Fin de turno:       duraciones, cooldowns, sustitución de caídos, nueva mano
// ─────────────────────────────────────────────────────────────
import { getServant } from '@/data/servants';
import { CHALDEA_UNIFORM } from '@/data/mysticCodes';
import {
  BUFF_LABEL, CARD_HITS, CLASS_STAR_WEIGHT, EXTRA_HITS, MAX_NP, MAX_STARS, POSITION_MOD,
} from '../constants';
import type { Rng } from '../rng';
import {
  DEBUFFS, type AllyUnit, type BattleKind, type BattleState, type CardType, type Effect,
  type EnemyUnit, type FxEvent, type HandCard, type SkillDef, type TargetSpec, type Unit,
} from '../types';
import { buffSum, computeDamage, computeNpGain, computeStarGen, hasBuff } from './damage';
import { makeAlly } from './factory';
import type { ServantInstance } from '../types';

// ─── Creación ────────────────────────────────────────────────

export function createBattle(rng: Rng, party: ServantInstance[], waves: EnemyUnit[][], kind: BattleKind): BattleState {
  const alive = party.filter((p) => p.hp > 0).map(makeAlly);
  const s: BattleState = {
    kind,
    waves,
    waveIndex: 0,
    enemies: waves[0],
    front: alive.slice(0, 3),
    back: alive.slice(3),
    fallen: [],
    deck: [],
    hand: [],
    selected: [],
    stars: 0,
    turn: 1,
    target: 0,
    masterCooldowns: CHALDEA_UNIFORM.skills.map(() => 0),
    status: 'player',
    log: [],
    fx: [],
    fxCounter: 0,
    cardCounter: 0,
  };
  log(s, `— Oleada 1/${waves.length} —`);
  dealHand(s, rng);
  return s;
}

// ─── Utilidades ──────────────────────────────────────────────

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
  s.deck = rng.shuffle(
    aliveFront(s).flatMap((a) => getServant(a.defId).deck.map((type) => ({ owner: a.key, type }))),
  );
}

function dealHand(s: BattleState, rng: Rng) {
  const aliveKeys = new Set(aliveFront(s).map((a) => a.key));
  s.deck = s.deck.filter((c) => aliveKeys.has(c.owner));
  if (s.deck.length < 5) rebuildDeck(s, rng);

  const drawn = s.deck.splice(0, 5);
  s.hand = drawn.map<HandCard>((c) => ({ id: `c${s.cardCounter++}`, owner: c.owner, type: c.type, stars: 0 }));

  // Reparto de estrellas críticas (peso por clase + bonus aleatorio, máx. 10 por carta)
  const bonus = rng.shuffle([50, 20, 20, 0, 0]);
  const weights = s.hand.map((c, i) => {
    const owner = s.front.find((a) => a.key === c.owner)!;
    return CLASS_STAR_WEIGHT[owner.cls] + (bonus[i] ?? 0);
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

// ─── Efectos ─────────────────────────────────────────────────

function resolveTargets(s: BattleState, source: Unit, spec: TargetSpec, allyKey?: string): Unit[] {
  switch (spec) {
    case 'self': return [source];
    case 'ally': {
      const t = aliveFront(s).find((a) => a.key === allyKey);
      return [t ?? source];
    }
    case 'allies': return aliveFront(s);
    case 'enemy': { const t = currentTarget(s); return t ? [t] : []; }
    case 'enemies': return aliveEnemies(s);
  }
}

function applyEffects(s: BattleState, source: Unit, effects: Effect[], allyKey?: string, scale = 1) {
  for (const ef of effects) {
    if (ef.type === 'stars') {
      s.stars = Math.min(MAX_STARS, s.stars + ef.amount);
      fx(s, source.key, 'buff', `+${ef.amount} ★`);
      continue;
    }
    const targets = resolveTargets(s, source, ef.target, allyKey);
    for (const t of targets) {
      switch (ef.type) {
        case 'buff': {
          const binary = ['evade', 'invincible', 'taunt', 'stun'].includes(ef.kind);
          t.buffs.push({
            kind: ef.kind,
            value: binary ? ef.value : Math.round(ef.value * scale * 1000) / 1000,
            turns: ef.turns,
            times: ef.times,
            source: source.name,
          });
          fx(s, t.key, 'buff', BUFF_LABEL[ef.kind]);
          break;
        }
        case 'heal': {
          const amount = Math.round(t.maxHp * ef.amount * scale);
          t.hp = Math.min(t.maxHp, t.hp + amount);
          fx(s, t.key, 'heal', `+${amount}`);
          break;
        }
        case 'np':
          if (t.side === 'ally') {
            t.np = Math.min(MAX_NP, t.np + ef.amount * scale);
            fx(s, t.key, 'np', `NP +${Math.round(ef.amount * scale)}%`);
          }
          break;
        case 'chargeDown':
          if (t.side === 'enemy') {
            t.charge = Math.max(0, t.charge - ef.amount);
            fx(s, t.key, 'buff', 'Carga ↓');
          }
          break;
        case 'cleanse':
          t.buffs = t.buffs.filter((b) => !DEBUFFS.includes(b.kind));
          fx(s, t.key, 'buff', 'Purificado');
          break;
      }
    }
  }
}

export function skillNeedsAlly(skill: SkillDef): boolean {
  return skill.effects.some((e) => 'target' in e && e.target === 'ally');
}

export function activateSkill(s: BattleState, key: string, idx: number, allyKey?: string): boolean {
  if (s.status !== 'player') return false;
  const unit = aliveFront(s).find((a) => a.key === key);
  if (!unit || unit.cooldowns[idx] !== 0) return false;
  const skill = getServant(unit.defId).skills[idx];
  applyEffects(s, unit, skill.effects, allyKey ?? unit.key);
  unit.cooldowns[idx] = skill.cooldown;
  log(s, `${unit.name} usa «${skill.name}».`);
  return true;
}

export function activateMasterSkill(s: BattleState, idx: number, allyKey?: string): boolean {
  if (s.status !== 'player' || s.masterCooldowns[idx] !== 0) return false;
  const skill = CHALDEA_UNIFORM.skills[idx];
  const source = aliveFront(s).find((a) => a.key === allyKey) ?? aliveFront(s)[0];
  if (!source) return false;
  applyEffects(s, source, skill.effects, allyKey ?? source.key);
  s.masterCooldowns[idx] = skill.cooldown;
  log(s, `Master usa «${skill.name}».`);
  return true;
}

/** Hechizo de Comando: NP +100% */
export function commandSealNp(s: BattleState, key: string): boolean {
  const u = aliveFront(s).find((a) => a.key === key);
  if (!u) return false;
  u.np = Math.min(MAX_NP, u.np + 100);
  fx(s, u.key, 'np', 'NP +100%');
  log(s, `¡Hechizo de Comando! ${u.name} libera su poder (NP +100%).`);
  return true;
}

/** Hechizo de Comando: curación total + purificar */
export function commandSealHeal(s: BattleState, key: string): boolean {
  const u = aliveFront(s).find((a) => a.key === key);
  if (!u) return false;
  u.hp = u.maxHp;
  u.buffs = u.buffs.filter((b) => !DEBUFFS.includes(b.kind));
  fx(s, u.key, 'heal', 'Vida al máximo');
  log(s, `¡Hechizo de Comando! ${u.name} recupera toda su vida.`);
  return true;
}

// ─── Selección de cartas ─────────────────────────────────────

export function npReady(s: BattleState, key: string): boolean {
  const u = aliveFront(s).find((a) => a.key === key);
  return !!u && u.np >= 100;
}

export function toggleSelect(s: BattleState, sel: string) {
  if (s.status !== 'player') return;
  const i = s.selected.indexOf(sel);
  if (i >= 0) { s.selected.splice(i, 1); return; }
  if (s.selected.length >= 3) return;
  if (sel.startsWith('np:') && !npReady(s, sel.slice(3))) return;
  s.selected.push(sel);
}

interface ChainCard { owner: string; type: CardType; isNp: boolean; stars: number }

export function describeChain(s: BattleState): { label: string | null; brave: boolean } {
  const chain = buildChain(s);
  if (chain.length < 3) return { label: null, brave: false };
  const types = new Set(chain.map((c) => c.type));
  const brave = chain.every((c) => c.owner === chain[0].owner);
  let label: string | null = null;
  if (types.size === 1) label = `${chain[0].type} Chain`;
  else if (types.size === 3) label = 'Mighty Chain';
  return { label, brave };
}

function buildChain(s: BattleState): ChainCard[] {
  return s.selected.map((sel) => {
    if (sel.startsWith('np:')) {
      const owner = sel.slice(3);
      const u = s.front.find((a) => a.key === owner)!;
      return { owner, type: getServant(u.defId).np.card, isNp: true, stars: 0 };
    }
    const c = s.hand.find((h) => h.id === sel)!;
    return { owner: c.owner, type: c.type, isNp: false, stars: c.stars };
  });
}

// ─── Resolución del turno ────────────────────────────────────

function damageUnit(s: BattleState, target: Unit, dmg: number, crit: boolean) {
  target.hp -= dmg;
  fx(s, target.key, crit ? 'crit' : 'damage', crit ? `${dmg}!` : `${dmg}`);
  if (target.hp <= 0) {
    const guts = target.buffs.find((b) => b.kind === 'guts' && (b.times === undefined || b.times > 0));
    if (guts) {
      target.hp = Math.max(1, Math.round(target.maxHp * guts.value));
      target.buffs = target.buffs.filter((b) => b !== guts);
      fx(s, target.key, 'buff', '¡Guts!');
      log(s, `¡${target.name} se niega a caer! (Guts)`);
    } else {
      target.hp = 0;
      log(s, target.side === 'enemy' ? `${target.name} ha sido derrotado.` : `${target.name} ha caído en combate.`);
    }
  }
}

function executeNp(s: BattleState, rng: Rng, att: AllyUnit): number {
  const npDef = getServant(att.defId).np;
  const oc = Math.max(1, Math.min(3, Math.floor(att.np / 100)));
  att.np = 0;
  const lvlScale = 1 + 0.15 * (att.npLevel - 1);
  log(s, `✦ ${att.name}: «${npDef.name}»${oc > 1 ? ` (OC ${oc * 100}%)` : ''}`);
  fx(s, att.key, 'np', npDef.name);

  applyEffects(s, att, npDef.pre ?? [], att.key, lvlScale);
  let stars = 0;
  if (npDef.kind !== 'support') {
    const mult = npDef.multiplier * (1 + 0.2 * (att.npLevel - 1)) * (1 + 0.1 * (oc - 1));
    const t0 = currentTarget(s);
    const targets = npDef.kind === 'single' ? (t0 ? [t0] : []) : aliveEnemies(s);
    for (const t of targets) {
      const dmg = computeDamage(att, t, {
        card: npDef.card, posMod: 1, busterFirst: false, npMult: mult, crit: false,
        busterChain: false, random: rng.range(0.9, 1.1),
      });
      damageUnit(s, t, dmg, false);
      att.np = Math.min(MAX_NP, att.np + computeNpGain(att, npDef.card, npDef.hits, {
        posMod: 1, artsFirst: false, crit: false, isNp: true, isExtra: false,
      }));
      stars += computeStarGen(att, npDef.card, npDef.hits, {
        posMod: 1, quickFirst: false, crit: false, isNp: true, isExtra: false,
      });
    }
  }
  applyEffects(s, att, npDef.post ?? [], att.key, lvlScale);
  return stars;
}

/** Ejecuta la cadena de 3 cartas + fase enemiga + fin de turno. */
export function executeTurn(s: BattleState, rng: Rng): void {
  if (s.status !== 'player' || s.selected.length !== 3) return;
  s.fx = [];
  const chain = buildChain(s);
  const types = new Set(chain.map((c) => c.type));
  const mighty = types.size === 3;
  const sameColor = types.size === 1;
  const first = chain[0].type;
  const busterFirst = first === 'Buster' || mighty;
  const artsFirst = first === 'Arts' || mighty;
  const quickFirst = first === 'Quick' || mighty;
  const busterChain = sameColor && first === 'Buster';
  const braveOwner = chain.every((c) => c.owner === chain[0].owner) ? chain[0].owner : null;

  if (sameColor) log(s, `¡${first} Chain!`);
  if (mighty) log(s, '¡Mighty Chain!');

  let starAcc = 0;
  chain.forEach((c, pos) => {
    const att = aliveFront(s).find((a) => a.key === c.owner);
    if (!att || aliveEnemies(s).length === 0) return;
    if (c.isNp) { starAcc += executeNp(s, rng, att); return; }

    const target = currentTarget(s)!;
    const crit = rng.chance(c.stars * 0.1);
    const posMod = POSITION_MOD[pos];
    const dmg = computeDamage(att, target, {
      card: c.type, posMod, busterFirst, crit, busterChain, random: rng.range(0.9, 1.1),
    });
    damageUnit(s, target, dmg, crit);
    const hits = CARD_HITS[c.type];
    att.np = Math.min(MAX_NP, att.np + computeNpGain(att, c.type, hits, { posMod, artsFirst, crit, isNp: false, isExtra: false }));
    starAcc += computeStarGen(att, c.type, hits, { posMod, quickFirst, crit, isNp: false, isExtra: false });
  });

  // Bonus de cadena
  if (sameColor && first === 'Arts') {
    for (const key of new Set(chain.map((c) => c.owner))) {
      const u = aliveFront(s).find((a) => a.key === key);
      if (u) { u.np = Math.min(MAX_NP, u.np + 20); fx(s, u.key, 'np', 'NP +20%'); }
    }
  }
  if (sameColor && first === 'Quick') starAcc += 10;

  // Brave Chain → Extra Attack
  if (braveOwner) {
    const att = aliveFront(s).find((a) => a.key === braveOwner);
    const target = currentTarget(s);
    if (att && target) {
      log(s, `¡Brave Chain! Extra Attack de ${att.name}.`);
      const card: CardType = busterChain ? 'Buster' : first;
      const dmg = computeDamage(att, target, {
        card, posMod: 1, busterFirst, extraMult: sameColor ? 3.5 : 2, crit: false, busterChain,
        random: rng.range(0.9, 1.1),
      });
      damageUnit(s, target, dmg, false);
      att.np = Math.min(MAX_NP, att.np + computeNpGain(att, card, EXTRA_HITS, { posMod: 1, artsFirst, crit: false, isNp: false, isExtra: true }));
      starAcc += computeStarGen(att, card, EXTRA_HITS, { posMod: 1, quickFirst, crit: false, isNp: false, isExtra: true });
    }
  }

  // Estrellas: parte entera + probabilidad de la fracción
  const gained = Math.floor(starAcc) + (rng.chance(starAcc % 1) ? 1 : 0);
  s.stars = Math.min(MAX_STARS, s.stars + gained);
  if (gained > 0) log(s, `+${gained} estrellas críticas.`);

  if (aliveEnemies(s).length === 0) {
    if (s.waveIndex + 1 < s.waves.length) {
      s.waveIndex++;
      s.enemies = s.waves[s.waveIndex];
      s.target = 0;
      log(s, `— Oleada ${s.waveIndex + 1}/${s.waves.length} —`);
    } else {
      s.status = 'won';
      log(s, '¡Victoria!');
      return;
    }
  } else {
    enemyPhase(s, rng);
  }
  endTurn(s, rng);
}

function pickAllyTarget(s: BattleState, rng: Rng): AllyUnit | undefined {
  const alive = aliveFront(s);
  const taunters = alive.filter((a) => hasBuff(a, 'taunt'));
  return taunters.length ? rng.pick(taunters) : alive.length ? rng.pick(alive) : undefined;
}

function hitAlly(s: BattleState, enemy: EnemyUnit, ally: AllyUnit, dmg: number) {
  const inv = ally.buffs.find((b) => b.kind === 'invincible' || b.kind === 'evade');
  if (inv) {
    if (inv.times !== undefined) inv.times--;
    if (inv.times === 0) ally.buffs = ally.buffs.filter((b) => b !== inv);
    fx(s, ally.key, 'miss', inv.kind === 'invincible' ? 'INVENCIBLE' : 'EVADE');
    return;
  }
  damageUnit(s, ally, dmg, false);
  // NP defensivo
  ally.np = Math.min(MAX_NP, ally.np + 3 * (1 + buffSum(ally, 'npGainUp')));
}

function enemyPhase(s: BattleState, rng: Rng) {
  for (const enemy of s.enemies) {
    if (enemy.hp <= 0) continue;
    if (hasBuff(enemy, 'stun')) {
      log(s, `${enemy.name} está aturdido.`);
      continue;
    }
    for (let a = 0; a < enemy.actions; a++) {
      if (aliveFront(s).length === 0) return;
      if (enemy.charge >= enemy.chargeMax) {
        log(s, `⚠ ${enemy.name} libera «${enemy.npName}»!`);
        const targets = enemy.npAoe ? aliveFront(s) : [pickAllyTarget(s, rng)!];
        for (const t of targets) {
          const dmg = computeDamage(enemy, t, {
            card: 'Arts', posMod: 1, busterFirst: false, npMult: enemy.npMult, crit: false,
            busterChain: false, random: rng.range(0.9, 1.1),
          });
          hitAlly(s, enemy, t, dmg);
        }
        enemy.charge = 0;
      } else {
        const t = pickAllyTarget(s, rng)!;
        const card = rng.pick<CardType>(['Buster', 'Arts', 'Quick']);
        const crit = rng.chance(0.06);
        const dmg = computeDamage(enemy, t, {
          card, posMod: 1, busterFirst: false, crit, busterChain: false, random: rng.range(0.9, 1.1),
        });
        hitAlly(s, enemy, t, dmg);
      }
    }
    enemy.charge = Math.min(enemy.chargeMax, enemy.charge + 1);
  }
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
    a.cooldowns = a.cooldowns.map((c) => (c === null ? null : Math.max(0, c - 1)));
  }
  [...s.front, ...s.enemies].forEach(tickBuffs);
  s.masterCooldowns = s.masterCooldowns.map((c) => Math.max(0, c - 1));

  // Sustituciones (Order Change automático al caer)
  const before = s.front.map((a) => a.key).join();
  s.front = s.front.map((a) => {
    if (a.hp > 0) return a;
    s.fallen.push(a);
    const sub = s.back.shift();
    if (sub) log(s, `${sub.name} entra en combate.`);
    return sub as AllyUnit;
  }).filter(Boolean);
  if (before !== s.front.map((a) => a.key).join()) s.deck = [];

  if (aliveFront(s).length === 0) {
    s.status = 'lost';
    log(s, 'Todo tu equipo ha caído…');
    return;
  }
  s.turn++;
  dealHand(s, rng);
}

/** Vida restante de cada Servant tras el combate (para persistir en la run). */
export function battleHpByUid(s: BattleState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const u of [...s.front, ...s.back, ...s.fallen]) out[u.key] = Math.max(0, u.hp);
  return out;
}
