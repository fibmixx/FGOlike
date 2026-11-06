// ─────────────────────────────────────────────────────────────
//  Core types. The engine (src/game) is pure TS — no React —
//  so it can be unit-tested and simulated headlessly.
// ─────────────────────────────────────────────────────────────

export type CardType = 'Buster' | 'Arts' | 'Quick';

export type ServantClass =
  | 'Saber' | 'Archer' | 'Lancer'
  | 'Rider' | 'Caster' | 'Assassin'
  | 'Berserker' | 'Shielder' | 'Ruler' | 'Avenger'
  | 'AlterEgo' | 'MoonCancer' | 'Foreigner' | 'Pretender' | 'Beast';

/** Hidden attributes: Man > Sky > Earth > Man; Star <-> Beast. */
export type Attribute = 'Man' | 'Sky' | 'Earth' | 'Star' | 'Beast';

export type BuffKind =
  | 'atkUp' | 'atkDown'
  | 'defUp' | 'defDown'
  | 'busterUp' | 'artsUp' | 'quickUp'
  | 'critUp' | 'critRateUp' | 'npDmgUp' | 'npGainUp' | 'starGenUp' | 'starAbsorbUp'
  | 'evade' | 'invincible' | 'taunt' | 'guts'
  | 'regen' | 'npRegen' | 'starRegen'
  | 'dmgCut' | 'dot' | 'stun';

export const DEBUFFS: BuffKind[] = ['atkDown', 'defDown', 'stun', 'dot'];

export interface Buff {
  kind: BuffKind;
  value: number;
  /** Turns left. -1 = permanent (passives, CEs). */
  turns: number;
  /** Uses left (evade, invincible, guts). undefined = unlimited. */
  times?: number;
  source: string;
}

/** others = every other ally on the field (FGO "ptOther"). */
export type TargetSpec = 'self' | 'ally' | 'allies' | 'others' | 'enemy' | 'enemies';

/**
 * Effects. `max` (optional) is the value at skill level 10 / NP level 5;
 * the plain value is level 1. `chance` (0..1) only applies to debuffs on enemies.
 */
export type Effect =
  | { type: 'buff'; target: TargetSpec; kind: BuffKind; value: number; max?: number; turns: number; times?: number; chance?: number }
  /** amount = fraction of max HP (0.3 = 30%) */
  | { type: 'heal'; target: TargetSpec; amount: number; max?: number }
  /** amount = NP points (%) */
  | { type: 'np'; target: TargetSpec; amount: number; max?: number }
  | { type: 'stars'; amount: number; max?: number }
  | { type: 'chargeDown'; target: TargetSpec; amount: number; max?: number; chance?: number }
  /** removes debuffs from allies */
  | { type: 'cleanse'; target: TargetSpec }
  /** removes buffs from enemies */
  | { type: 'dispel'; target: TargetSpec };

export interface SkillDef {
  id: string;
  name: string;
  /** cooldown at skill level 1 */
  cooldown: number;
  /** cooldown at skill level 10 */
  cooldownMax?: number;
  effects: Effect[];
  /** optional flavour; the UI generates the rules text from `effects` */
  description?: string;
}

export interface NoblePhantasmDef {
  name: string;
  title?: string;
  card: CardType;
  kind: 'single' | 'aoe' | 'support';
  /** Damage multiplier at NP1 (FGO: 4.5 = 450%) */
  multiplier: number;
  /** Damage multiplier at NP5 */
  multiplierMax?: number;
  hits: number;
  pre?: Effect[];
  post?: Effect[];
}

export interface ServantDef {
  id: string;
  name: string;
  cls: ServantClass;
  rarity: 0 | 1 | 2 | 3 | 4 | 5;
  attribute: Attribute;
  /** [level 1, level 90] */
  hp: [number, number];
  atk: [number, number];
  deck: [CardType, CardType, CardType, CardType, CardType];
  /** NP gained per hit (%) */
  npRate: number;
  /** NP gained per hit received (%) */
  npDef?: number;
  /** Star drop rate per hit (0..1) */
  starRate: number;
  /** Star absorption weight (FGO starAbsorb) */
  starAbsorb?: number;
  /** Hits per card type */
  hits?: { Buster: number; Arts: number; Quick: number; Extra: number };
  skills: SkillDef[];
  /** Class skills: always active (turns -1) */
  passives?: { name: string; effects: Effect[] }[];
  np: NoblePhantasmDef;
  traits?: string[];
  /** Not in the summoning pool (e.g. Mash, who joins at the start). */
  noGacha?: boolean;
  /** Atlas collection number */
  collectionNo?: number;
}

export interface EnemyPhase {
  /** HP of this bar at level 1 (scales like the base HP) */
  hp: number;
  text: string;
  effects?: Effect[];
  npName?: string;
  npMult?: number;
  actions?: number;
  /** Fill the charge gauge when this phase starts */
  fullCharge?: boolean;
}

export interface EnemyDef {
  id: string;
  name: string;
  cls: ServantClass;
  attribute: Attribute;
  hp: number;
  atk: number;
  chargeMax: number;
  npName: string;
  npMult: number;
  npAoe: boolean;
  boss?: boolean;
  actions?: number;
  passives?: Effect[];
  /** Extra HP bars (boss phases), in order */
  phases?: EnemyPhase[];
  icon: string;
}

export interface CraftEssenceDef {
  id: string;
  name: string;
  rarity: 3 | 4 | 5;
  /** flat stats at level 90 (scaled by the holder's level) */
  atk: number;
  hp: number;
  /** applied to the holder at the start of each battle */
  effects: Effect[];
  text: string;
}

// ─── Persistent instances (run) ─────────────────────────────

export interface ServantInstance {
  uid: string;
  defId: string;
  level: number;
  exp: number;
  /** 0..4 */
  ascension: number;
  /** Noble Phantasm level 1..5 (raised by duplicate summons) */
  npLevel: number;
  /** Persistent HP between battles */
  hp: number;
  /** NP carried over from the previous battle */
  np: number;
  /** equipped Craft Essence (uid in run.ces) */
  ce: string | null;
}

export interface CeInstance {
  uid: string;
  defId: string;
}

export type NodeType = 'battle' | 'elite' | 'gacha' | 'rest' | 'treasure' | 'boss';

export interface MapNode {
  id: string;
  layer: number;
  /** horizontal position 0..1 */
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

// ─── Battle ─────────────────────────────────────────────────

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
  /** Skills resolved for this servant's skill level */
  skills: SkillDef[];
  /** cooldown left per skill; null = locked (needs ascension) */
  cooldowns: (number | null)[];
  npDef: NoblePhantasmDef;
  npRate: number;
  npDefRate: number;
  starRate: number;
  starAbsorb: number;
  hits: { Buster: number; Arts: number; Quick: number; Extra: number };
  /** class passives + Craft Essence, applied when the unit enters the field */
  onEnter: { source: string; effects: Effect[] }[];
  entered: boolean;
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
  /** remaining phases (HP bars) */
  phases: EnemyPhase[];
  totalBars: number;
  /** used its NP this turn (skips the charge increase) */
  justNp?: boolean;
}

export type Unit = AllyUnit | EnemyUnit;

export interface HandCard {
  id: string;
  owner: string;
  type: CardType;
  stars: number;
}

/** A HandCard id, or `np:<key>` for a Noble Phantasm. */
export type Selection = string;

export interface FxEvent {
  id: number;
  target: string;
  kind: 'damage' | 'heal' | 'miss' | 'crit' | 'buff' | 'np';
  text: string;
}

export type BattleKind = 'battle' | 'elite' | 'boss';

export interface ChainCard { owner: string; type: CardType; isNp: boolean; stars: number }

export interface ChainContext {
  cards: ChainCard[];
  busterFirst: boolean;
  artsFirst: boolean;
  quickFirst: boolean;
  busterChain: boolean;
  artsChain: boolean;
  quickChain: boolean;
  mighty: boolean;
  braveOwner: string | null;
  starAcc: number;
}

export type TurnStep =
  | { t: 'card'; i: number }
  | { t: 'chainBonus' }
  | { t: 'extra' }
  | { t: 'resolveChain' }
  | { t: 'enemy'; key: string; n: number }
  | { t: 'enemyCharge' }
  | { t: 'endTurn' };

export interface BattleState {
  kind: BattleKind;
  waves: EnemyUnit[][];
  waveIndex: number;
  enemies: EnemyUnit[];
  front: AllyUnit[];
  back: AllyUnit[];
  fallen: AllyUnit[];
  deck: { owner: string; type: CardType }[];
  hand: HandCard[];
  selected: Selection[];
  stars: number;
  turn: number;
  target: number;
  status: 'player' | 'won' | 'lost';
  /** select = player input; resolving = playing the queued turn steps */
  phase: 'select' | 'resolving';
  queue: TurnStep[];
  chain: ChainContext | null;
  /** unit currently acting (for animations) */
  acting: string | null;
  /** index of the chain card being resolved */
  actingCard: number | null;
  /** big cut-in text (NP names, phase changes) */
  banner: string | null;
  log: string[];
  fx: FxEvent[];
  fxCounter: number;
  cardCounter: number;
}

// ─── Run ────────────────────────────────────────────────────

export type Phase =
  | 'starter'
  | 'map'
  | 'battle'
  | 'battleResult'
  | 'ceReward'
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
  singularity: number;
  map: MapData;
  currentNode: string | null;
  party: ServantInstance[];
  ces: CeInstance[];
  crystals: number;
  commandSeals: number;
  /** Mystic Code skills used in the current Singularity */
  mysticUsed: boolean[];
  uidCounter: number;
  gachaOptions: string[];
  /** a Command Seal was found in this summon */
  gachaSeal: boolean;
  starterOptions: string[];
  ceOptions: string[];
  battle: BattleState | null;
  lastReward: BattleReward | null;
  treasureText: string | null;
  stats: { battles: number; turns: number; recruits: number; startedAt: number };
}
