import type { Attribute, BuffKind, CardType, ServantClass } from './types';

// ─── Cartas (valores de FGO) ─────────────────────────────────
export const CARD_DAMAGE: Record<CardType, number> = { Buster: 1.5, Arts: 1.0, Quick: 0.8 };
export const CARD_NP: Record<CardType, number> = { Buster: 0, Arts: 3, Quick: 1 };
export const CARD_STAR: Record<CardType, number> = { Buster: 0.1, Arts: 0, Quick: 0.8 };
export const CARD_HITS: Record<CardType, number> = { Buster: 1, Arts: 2, Quick: 3 };
export const CARD_BUFF: Record<CardType, BuffKind> = { Buster: 'busterUp', Arts: 'artsUp', Quick: 'quickUp' };
/** Bonus por posición en la cadena (1ª, 2ª, 3ª carta) */
export const POSITION_MOD = [1, 1.2, 1.4];
export const EXTRA_HITS = 4;
export const MAX_STARS = 50;
export const MAX_NP = 300;

// ─── Clases ──────────────────────────────────────────────────
export const CLASS_ATK_MOD: Record<ServantClass, number> = {
  Saber: 1, Archer: 0.95, Lancer: 1.05, Rider: 1, Caster: 0.9,
  Assassin: 0.9, Berserker: 1.1, Shielder: 1, Ruler: 1.1, Avenger: 1.1,
};

/** Peso para absorber estrellas críticas (Rider/Assassin las acaparan). */
export const CLASS_STAR_WEIGHT: Record<ServantClass, number> = {
  Saber: 100, Archer: 150, Lancer: 90, Rider: 200, Caster: 50,
  Assassin: 100, Berserker: 10, Shielder: 100, Ruler: 100, Avenger: 30,
};

type Affinity = Partial<Record<ServantClass, number>>;
const AFFINITY: Record<ServantClass, Affinity> = {
  Saber: { Lancer: 2, Archer: 0.5, Berserker: 2, Ruler: 0.5 },
  Archer: { Saber: 2, Lancer: 0.5, Berserker: 2, Ruler: 0.5 },
  Lancer: { Archer: 2, Saber: 0.5, Berserker: 2, Ruler: 0.5 },
  Rider: { Caster: 2, Assassin: 0.5, Berserker: 2, Ruler: 0.5 },
  Caster: { Assassin: 2, Rider: 0.5, Berserker: 2, Ruler: 0.5 },
  Assassin: { Rider: 2, Caster: 0.5, Berserker: 2, Ruler: 0.5 },
  Berserker: {
    Saber: 2, Archer: 2, Lancer: 2, Rider: 2, Caster: 2, Assassin: 2,
    Berserker: 2, Ruler: 2, Avenger: 2,
  },
  Shielder: {},
  Ruler: { Berserker: 2, Avenger: 0.5 },
  Avenger: { Ruler: 2, Berserker: 2 },
};

export function classAffinity(att: ServantClass, def: ServantClass): number {
  return AFFINITY[att][def] ?? 1;
}

const ATTR_ADV: Record<Attribute, Attribute[]> = {
  Man: ['Sky'], Sky: ['Earth'], Earth: ['Man'], Star: ['Beast'], Beast: ['Star'],
};
export function attributeAffinity(att: Attribute, def: Attribute): number {
  if (ATTR_ADV[att].includes(def)) return 1.1;
  if (ATTR_ADV[def].includes(att) && !(att === 'Star' || att === 'Beast')) return 0.9;
  return 1;
}

// ─── Progresión ──────────────────────────────────────────────
/** Nivel máximo por ascensión (0..4) */
export const LEVEL_CAPS = [20, 40, 60, 80, 90];
/** Cristales necesarios para pasar a la ascensión i+1 */
export const ASCENSION_COST = [1, 1, 2, 2];
export const MAX_PARTY = 6;
export const MAX_COMMAND_SEALS = 3;

export function expToNext(level: number): number {
  return Math.round(20 + level * 6 + 0.12 * level * level);
}

// ─── Presentación ────────────────────────────────────────────
export const CLASS_ICON: Record<ServantClass, string> = {
  Saber: '⚔', Archer: '🏹', Lancer: '🔱', Rider: '🐎', Caster: '✷',
  Assassin: '🗡', Berserker: '💢', Shielder: '🛡', Ruler: '⚖', Avenger: '🔥',
};

export const CLASS_NAME_ES: Record<ServantClass, string> = {
  Saber: 'Saber', Archer: 'Archer', Lancer: 'Lancer', Rider: 'Rider', Caster: 'Caster',
  Assassin: 'Assassin', Berserker: 'Berserker', Shielder: 'Shielder', Ruler: 'Ruler', Avenger: 'Avenger',
};

export const BUFF_LABEL: Record<BuffKind, string> = {
  atkUp: 'ATK ↑', atkDown: 'ATK ↓', defUp: 'DEF ↑', defDown: 'DEF ↓',
  busterUp: 'Buster ↑', artsUp: 'Arts ↑', quickUp: 'Quick ↑',
  critUp: 'Crítico ↑', npDmgUp: 'Daño NP ↑', npGainUp: 'Ganancia NP ↑', starGenUp: 'Estrellas ↑',
  evade: 'Evasión', invincible: 'Invencible', taunt: 'Provocación', guts: 'Guts',
  regen: 'Regeneración', npRegen: 'NP por turno', stun: 'Aturdido',
};

export const NODE_INFO = {
  battle: { icon: '⚔', label: 'Combate' },
  elite: { icon: '☠', label: 'Élite' },
  gacha: { icon: '✦', label: 'Invocación' },
  rest: { icon: '♨', label: 'Descanso' },
  treasure: { icon: '◈', label: 'Tesoro' },
  boss: { icon: '♛', label: 'Jefe' },
} as const;
