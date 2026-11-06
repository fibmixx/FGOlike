import generatedRelation from '@/data/generated/classRelation.json';
import type { Attribute, BuffKind, CardType, ServantClass } from './types';

// ─── Cards (FGO values) ─────────────────────────────────────
export const CARD_DAMAGE: Record<CardType, number> = { Buster: 1.5, Arts: 1.0, Quick: 0.8 };
export const CARD_NP: Record<CardType, number> = { Buster: 0, Arts: 3, Quick: 1 };
export const CARD_STAR: Record<CardType, number> = { Buster: 0.1, Arts: 0, Quick: 0.8 };
export const DEFAULT_HITS = { Buster: 1, Arts: 2, Quick: 3, Extra: 4 };
export const CARD_BUFF: Record<CardType, BuffKind> = { Buster: 'busterUp', Arts: 'artsUp', Quick: 'quickUp' };
/** Chain position bonus (1st, 2nd, 3rd card) */
export const POSITION_MOD = [1, 1.2, 1.4];
export const MAX_STARS = 50;
export const MAX_NP = 300;
/** Share of NP kept between battles */
export const NP_CARRY_OVER = 0.5;

// ─── Classes ────────────────────────────────────────────────
export const ALL_CLASSES: ServantClass[] = [
  'Saber', 'Archer', 'Lancer', 'Rider', 'Caster', 'Assassin', 'Berserker',
  'Shielder', 'Ruler', 'Avenger', 'AlterEgo', 'MoonCancer', 'Foreigner', 'Pretender', 'Beast',
];

export const CLASS_LABEL: Record<ServantClass, string> = {
  Saber: 'Saber', Archer: 'Archer', Lancer: 'Lancer', Rider: 'Rider', Caster: 'Caster',
  Assassin: 'Assassin', Berserker: 'Berserker', Shielder: 'Shielder', Ruler: 'Ruler', Avenger: 'Avenger',
  AlterEgo: 'Alter Ego', MoonCancer: 'Moon Cancer', Foreigner: 'Foreigner', Pretender: 'Pretender', Beast: 'Beast',
};

export const CLASS_COLOR: Record<ServantClass, string> = {
  Saber: '#4d7cff', Archer: '#e0473f', Lancer: '#3ab0a2', Rider: '#d9a72b', Caster: '#9b5de5',
  Assassin: '#7d7d96', Berserker: '#c2185b', Shielder: '#8aa0b8', Ruler: '#f2d16b', Avenger: '#a12a2a',
  AlterEgo: '#d46bb8', MoonCancer: '#58c4dd', Foreigner: '#5e4bd1', Pretender: '#4fbf7f', Beast: '#e0702a',
};

export const CLASS_ATK_MOD: Record<ServantClass, number> = {
  Saber: 1, Archer: 0.95, Lancer: 1.05, Rider: 1, Caster: 0.9, Assassin: 0.9,
  Berserker: 1.1, Shielder: 1, Ruler: 1.1, Avenger: 1.1,
  AlterEgo: 1, MoonCancer: 1, Foreigner: 1, Pretender: 1, Beast: 1,
};

/** Fallback star absorption by class (overridden by Atlas starAbsorb). */
export const CLASS_STAR_WEIGHT: Record<ServantClass, number> = {
  Saber: 100, Archer: 150, Lancer: 90, Rider: 200, Caster: 50, Assassin: 100, Berserker: 10,
  Shielder: 100, Ruler: 100, Avenger: 30, AlterEgo: 100, MoonCancer: 50, Foreigner: 150, Pretender: 50, Beast: 100,
};

type Table = Partial<Record<ServantClass, Partial<Record<ServantClass, number>>>>;

/** Fallback affinity table (attacker → defender). `npm run import:atlas` writes the exact one. */
const FALLBACK_AFFINITY: Table = {
  Saber: { Lancer: 2, Archer: 0.5, Berserker: 2, Ruler: 0.5 },
  Archer: { Saber: 2, Lancer: 0.5, Berserker: 2, Ruler: 0.5 },
  Lancer: { Archer: 2, Saber: 0.5, Berserker: 2, Ruler: 0.5 },
  Rider: { Caster: 2, Assassin: 0.5, Berserker: 2, Ruler: 0.5 },
  Caster: { Assassin: 2, Rider: 0.5, Berserker: 2, Ruler: 0.5 },
  Assassin: { Rider: 2, Caster: 0.5, Berserker: 2, Ruler: 0.5 },
  Berserker: {
    Saber: 2, Archer: 2, Lancer: 2, Rider: 2, Caster: 2, Assassin: 2, Berserker: 2, Ruler: 2,
    Avenger: 2, AlterEgo: 2, MoonCancer: 2, Foreigner: 0.5, Pretender: 2, Beast: 2,
  },
  Shielder: {},
  Ruler: { Berserker: 2, MoonCancer: 2, Avenger: 0.5 },
  Avenger: { Berserker: 2, Ruler: 2, MoonCancer: 0.5 },
  MoonCancer: { Berserker: 2, Avenger: 2, Ruler: 0.5 },
  AlterEgo: { Rider: 2, Caster: 2, Assassin: 2, Berserker: 2, Foreigner: 2, Saber: 0.5, Archer: 0.5, Lancer: 0.5, Pretender: 0.5 },
  Foreigner: { Berserker: 2, Foreigner: 2, Pretender: 2, AlterEgo: 0.5 },
  Pretender: { Saber: 2, Archer: 2, Lancer: 2, AlterEgo: 2, Berserker: 2, Rider: 0.5, Caster: 0.5, Assassin: 0.5, Foreigner: 0.5 },
  Beast: { Berserker: 2 },
};

const GENERATED = generatedRelation as Table;
const AFFINITY: Table = Object.keys(GENERATED).length ? GENERATED : FALLBACK_AFFINITY;

export function classAffinity(att: ServantClass, def: ServantClass): number {
  return AFFINITY[att]?.[def] ?? 1;
}

const ATTR_ADV: Record<Attribute, Attribute[]> = {
  Man: ['Sky'], Sky: ['Earth'], Earth: ['Man'], Star: ['Beast'], Beast: ['Star'],
};
export function attributeAffinity(att: Attribute, def: Attribute): number {
  if (ATTR_ADV[att].includes(def)) return 1.1;
  if (ATTR_ADV[def].includes(att) && !(att === 'Star' || att === 'Beast')) return 0.9;
  return 1;
}

// ─── Progression ────────────────────────────────────────────
export const LEVEL_CAPS = [20, 40, 60, 80, 90];
export const ASCENSION_COST = [1, 1, 2, 2];
export const MAX_PARTY = 6;
export const MAX_COMMAND_SEALS = 3;
/** Chance that a summon also yields a Command Seal */
export const GACHA_SEAL_CHANCE = 0.08;

export function expToNext(level: number): number {
  return Math.round(20 + level * 6 + 0.12 * level * level);
}

/** Skill level 1..10 from servant level (Lv 90 → skill level 10) */
export function skillLevelFor(level: number): number {
  return Math.max(1, Math.min(10, 1 + Math.floor((level - 1) / 9)));
}

// ─── Presentation ───────────────────────────────────────────
export const BUFF_LABEL: Record<BuffKind, string> = {
  atkUp: 'ATK ↑', atkDown: 'ATK ↓', defUp: 'DEF ↑', defDown: 'DEF ↓',
  busterUp: 'Buster ↑', artsUp: 'Arts ↑', quickUp: 'Quick ↑',
  critUp: 'Crit DMG ↑', critRateUp: 'Crit Rate ↑', npDmgUp: 'NP DMG ↑', npGainUp: 'NP Gain ↑',
  starGenUp: 'Star Gen ↑', starAbsorbUp: 'Star Absorb ↑',
  evade: 'Evade', invincible: 'Invincible', taunt: 'Taunt', guts: 'Guts',
  regen: 'HP Regen', npRegen: 'NP Regen', starRegen: 'Star Regen',
  dmgCut: 'DMG Cut', dot: 'Burn', stun: 'Stun',
};

export const NODE_INFO = {
  battle: { icon: '⚔', label: 'Battle' },
  elite: { icon: '☠', label: 'Elite' },
  gacha: { icon: '✦', label: 'Summon' },
  rest: { icon: '♨', label: 'Rest' },
  treasure: { icon: '◈', label: 'Treasure' },
  boss: { icon: '♛', label: 'Boss' },
} as const;
