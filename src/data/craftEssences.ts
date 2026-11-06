// Curated Craft Essences. Names are from FGO; effects are tuned for FGOlike
// (applied to the holder at the start of every battle).
import type { BuffKind, CraftEssenceDef, Effect, TargetSpec } from '@/game/types';

const b = (kind: BuffKind, value: number, target: TargetSpec = 'self', turns = -1, times?: number): Effect =>
  ({ type: 'buff', target, kind, value, turns, ...(times !== undefined && { times }) });
const np = (amount: number): Effect => ({ type: 'np', target: 'self', amount });
const stars = (amount: number): Effect => ({ type: 'stars', amount });

const ce = (id: string, name: string, rarity: CraftEssenceDef['rarity'], atk: number, hp: number, text: string, effects: Effect[]): CraftEssenceDef =>
  ({ id, name, rarity, atk, hp, text, effects });

export const CRAFT_ESSENCES: CraftEssenceDef[] = [
  // ─── 5★ ───
  ce('kaleidoscope', 'Kaleidoscope', 5, 2000, 0, 'Start each battle with 80% NP.', [np(80)]),
  ce('black_grail', 'The Black Grail', 5, 2400, 0, 'NP damage +60%. Lose 300 HP each turn.', [b('npDmgUp', 0.6), b('dot', 300)]),
  ce('formal_craft', 'Formal Craft', 5, 2000, 0, 'Arts performance +25%.', [b('artsUp', 0.25)]),
  ce('imaginary_element', 'Imaginary Element', 5, 0, 2000, 'Start with 60% NP. NP gain +10%.', [np(60), b('npGainUp', 0.1)]),
  ce('prisma_cosmos', 'Prisma Cosmos', 5, 0, 2000, 'Gain 8% NP every turn.', [b('npRegen', 8)]),
  ce('aerial_drive', 'Aerial Drive', 5, 1000, 1000, 'Start with 50% NP. Arts performance +10%.', [np(50), b('artsUp', 0.1)]),
  ce('heavens_feel', "Heaven's Feel", 5, 2000, 0, 'NP damage +40%.', [b('npDmgUp', 0.4)]),
  ce('victor_moon', 'Victor of the Moon', 5, 2000, 0, 'Buster performance +15%. Critical damage +15%.', [b('busterUp', 0.15), b('critUp', 0.15)]),
  ce('volumen', 'Volumen Hydrargyrum', 5, 0, 2000, 'Invincible against 3 attacks (once per battle).', [b('invincible', 1, 'self', -1, 3)]),
  ce('holy_shroud', 'Holy Shroud of Magdalene', 5, 0, 2400, 'DEF +15%. Damage taken -200.', [b('defUp', 0.15), b('dmgCut', 200)]),
  ce('origin_bullet', 'Origin Bullet', 5, 2000, 0, 'ATK +15%. Critical damage +20%.', [b('atkUp', 0.15), b('critUp', 0.2)]),
  // ─── 4★ ───
  ce('limited_zero', 'Limited/Zero Over', 4, 1500, 0, 'Buster performance +15%.', [b('busterUp', 0.15)]),
  ce('projection', 'Projection', 4, 1500, 0, 'Arts performance +15%.', [b('artsUp', 0.15)]),
  ce('verdant', 'Verdant Sound of Destruction', 4, 1500, 0, 'Quick performance +15%.', [b('quickUp', 0.15)]),
  ce('fragments_2030', 'Fragments of 2030', 4, 0, 1500, 'Gain 8 critical stars every turn.', [b('starRegen', 8)]),
  ce('ideal_holy_king', 'Ideal Holy King', 4, 0, 1800, 'Restore 5% HP every turn.', [b('regen', 0.05)]),
  ce('iron_willed', 'Iron-Willed Training', 4, 0, 1500, 'Evade 2 attacks (once per battle).', [b('evade', 1, 'self', -1, 2)]),
  ce('gandr_ce', 'Gandr', 4, 1500, 0, 'Start with 40% NP.', [np(40)]),
  // ─── 3★ ───
  ce('azoth_blade', 'Azoth Blade', 3, 1000, 0, 'Star generation +15%.', [b('starGenUp', 0.15)]),
  ce('mana_gauge', 'Mana Gauge', 3, 0, 1000, 'Start with 30% NP.', [np(30)]),
  ce('runestones', 'Runestones', 3, 0, 1200, 'Critical stars +10 at battle start. Star absorption +100%.', [stars(10), b('starAbsorbUp', 1)]),
  ce('anchors_aweigh', 'Anchors Aweigh', 3, 0, 1500, 'DEF +8%.', [b('defUp', 0.08)]),
  ce('golden_millennium', 'Golden Millennium Tree', 3, 0, 1800, 'Guts once (20% HP).', [b('guts', 0.2, 'self', -1, 1)]),
  ce('chaldea_teatime', 'Chaldea Teatime', 3, 800, 800, 'Taunt for the first 2 turns. DEF +10%.', [b('taunt', 1, 'self', 2), b('defUp', 0.1)]),
];

const BY_ID: Record<string, CraftEssenceDef> = Object.fromEntries(CRAFT_ESSENCES.map((c) => [c.id, c]));

export function getCraftEssence(id: string): CraftEssenceDef {
  const c = BY_ID[id];
  if (!c) throw new Error(`Unknown Craft Essence: ${id}`);
  return c;
}
