// ─────────────────────────────────────────────────────────────
//  Tipos centrales del juego. Todo el motor (src/game) es TS puro,
//  sin React, para poder testearlo y reutilizarlo.
// ─────────────────────────────────────────────────────────────

export type CardType = 'Buster' | 'Arts' | 'Quick';

export type ServantClass =
  | 'Saber' | 'Archer' | 'Lancer'
  | 'Rider' | 'Caster' | 'Assassin'
  | 'Berserker' | 'Shielder' | 'Ruler' | 'Avenger';

/** Atributos ocultos de FGO: Hombre > Cielo > Tierra > Hombre; Estrella <-> Bestia. */
export type Attribute = 'Man' | 'Sky' | 'Earth' | 'Star' | 'Beast';

export type BuffKind =
  | 'atkUp' | 'atkDown'
  | 'defUp' | 'defDown'
  | 'busterUp' | 'artsUp' | 'quickUp'
  | 'critUp' | 'npDmgUp' | 'npGainUp' | 'starGenUp'
  | 'evade' | 'invincible' | 'taunt' | 'guts'
  | 'regen' | 'npRegen' | 'stun';

export const DEBUFFS: BuffKind[] = ['atkDown', 'defDown', 'stun'];

export interface Buff {
  kind: BuffKind;
  value: number;
  /** Turnos restantes. -1 = permanente (pasivas de jefe). */
  turns: number;
  /** Usos restantes (evasión, invencibilidad, guts). undefined = ilimitado. */
  times?: number;
  source: string;
}

export type TargetSpec = 'self' | 'ally' | 'allies' | 'enemy' | 'enemies';

export type Effect =
  | { type: 'buff'; target: TargetSpec; kind: BuffKind; value: number; turns: number; times?: number }
  /** amount = fracción de la vida máxima (0.3 = 30%) */
  | { type: 'heal'; target: TargetSpec; amount: number }
  /** amount = puntos de NP (%) */
  | { type: 'np'; target: TargetSpec; amount: number }
  | { type: 'stars'; amount: number }
  | { type: 'chargeDown'; target: TargetSpec; amount: number }
  | { type: 'cleanse'; target: TargetSpec };

export interface SkillDef {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  effects: Effect[];
}

export interface NoblePhantasmDef {
  name: string;
  /** Nombre "de pantalla" / traducción */
  title: string;
  card: CardType;
  kind: 'single' | 'aoe' | 'support';
  /** Multiplicador de daño a NP nivel 1 (FGO: ~3.0–6.0 single, ~3.0–4.5 AoE). */
  multiplier: number;
  hits: number;
  pre?: Effect[];
  post?: Effect[];
  description: string;
}

export interface ServantDef {
  id: string;
  name: string;
  cls: ServantClass;
  rarity: 1 | 2 | 3 | 4 | 5;
  attribute: Attribute;
  /** [nivel 1, nivel 90] */
  hp: [number, number];
  atk: [number, number];
  /** 5 cartas de comando */
  deck: [CardType, CardType, CardType, CardType, CardType];
  /** NP ganado por hit (en %) */
  npRate: number;
  /** Probabilidad base de estrella por hit (0..1) */
  starRate: number;
  skills: [SkillDef, SkillDef, SkillDef];
  np: NoblePhantasmDef;
  /** Si es true no sale en el gacha (p.ej. Mash, que se une al empezar). */
  noGacha?: boolean;
  lore: string;
}

export interface EnemyDef {
  id: string;
  name: string;
  cls: ServantClass;
  attribute: Attribute;
  /** Stats base a nivel 1 (escalan con el nivel). */
  hp: number;
  atk: number;
  chargeMax: number;
  npName: string;
  npMult: number;
  npAoe: boolean;
  boss?: boolean;
  /** Acciones por turno (los jefes actúan 2–3 veces). */
  actions?: number;
  passives?: Effect[];
  icon: string;
}

// ─── Instancias persistentes (run) ───────────────────────────

export interface ServantInstance {
  uid: string;
  defId: string;
  level: number;
  exp: number;
  /** 0..4 */
  ascension: number;
  /** Nivel de Noble Phantasm 1..5 (sube con duplicados del gacha) */
  npLevel: number;
  /** Vida actual persistente entre combates (roguelike) */
  hp: number;
}

export type NodeType = 'battle' | 'elite' | 'gacha' | 'rest' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  layer: number;
  /** posición horizontal normalizada 0..1 */
  x: number;
  type: NodeType;
  next: string[];
  visited: boolean;
}

export interface MapData {
  singularity: number;
  layers: number;
  nodes: Record<string, MapNode>;
  startIds: string[];
}

// ─── Combate ─────────────────────────────────────────────────

interface UnitBase {
  key: string;
  name: string;
  cls: ServantClass;
  attribute: Attribute;
  maxHp: number;
  hp: number;
  atk: number;
  buffs: Buff[];
}

export interface AllyUnit extends UnitBase {
  side: 'ally';
  defId: string;
  np: number;
  npLevel: number;
  ascension: number;
  /** cooldown restante por skill; null = bloqueada (requiere ascensión) */
  cooldowns: (number | null)[];
  npRate: number;
  starRate: number;
}

export interface EnemyUnit extends UnitBase {
  side: 'enemy';
  defId: string;
  level: number;
  charge: number;
  chargeMax: number;
  npName: string;
  npMult: number;
  npAoe: boolean;
  boss: boolean;
  actions: number;
  icon: string;
}

export type Unit = AllyUnit | EnemyUnit;

export interface HandCard {
  id: string;
  owner: string; // key del AllyUnit
  type: CardType;
  stars: number;
}

/** Selección: id de HandCard, o `np:<key>` para un Noble Phantasm. */
export type Selection = string;

export interface FxEvent {
  id: number;
  target: string; // key de unidad
  kind: 'damage' | 'heal' | 'miss' | 'crit' | 'buff' | 'np';
  text: string;
}

export type BattleKind = 'battle' | 'elite' | 'boss';

export interface BattleState {
  kind: BattleKind;
  waves: EnemyUnit[][];
  waveIndex: number;
  enemies: EnemyUnit[];
  /** Hasta 3 en primera línea. Puede contener caídos hasta el fin de turno. */
  front: AllyUnit[];
  back: AllyUnit[];
  fallen: AllyUnit[];
  deck: { owner: string; type: CardType }[];
  hand: HandCard[];
  selected: Selection[];
  stars: number;
  turn: number;
  target: number;
  masterCooldowns: number[];
  status: 'player' | 'won' | 'lost';
  log: string[];
  fx: FxEvent[];
  fxCounter: number;
  cardCounter: number;
}

// ─── Run ─────────────────────────────────────────────────────

export type Phase =
  | 'starter'
  | 'map'
  | 'battle'
  | 'battleResult'
  | 'gacha'
  | 'rest'
  | 'treasure'
  | 'singularityClear'
  | 'gameover'
  | 'victory';

export interface BattleReward {
  exp: number;
  crystals: number;
  levelUps: { uid: string; from: number; to: number }[];
}

export interface RunState {
  version: number;
  seed: number;
  rngState: number;
  phase: Phase;
  singularity: number; // 0..7
  map: MapData;
  currentNode: string | null;
  /** Orden = formación. Los 3 primeros vivos van a primera línea. */
  party: ServantInstance[];
  crystals: number;
  commandSeals: number;
  uidCounter: number;
  gachaOptions: string[];
  starterOptions: string[];
  battle: BattleState | null;
  lastReward: BattleReward | null;
  treasureText: string | null;
  stats: { battles: number; turns: number; recruits: number; startedAt: number };
}
