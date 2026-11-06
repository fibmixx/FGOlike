import { getEnemy } from '@/data/enemies';
import { getServant } from '@/data/servants';
import { getCraftEssence } from '@/data/craftEssences';
import { SINGULARITIES } from '@/data/singularities';
import { CLASS_STAR_WEIGHT, DEFAULT_HITS, skillLevelFor } from '../constants';
import { resolveNp, resolveSkill } from '../effects';
import { statsFor, unlockedSkills } from '../progression/leveling';
import type { Rng } from '../rng';
import type { AllyUnit, BattleKind, Buff, CraftEssenceDef, EnemyUnit, ServantInstance } from '../types';

export function enemyScale(level: number): number {
  return 1 + 0.065 * (level - 1);
}

/** CE flat stats scale with the holder's level (25% at Lv1 → 100% at Lv90). */
export function ceStatScale(level: number): number {
  return 0.25 + 0.75 * (level / 90);
}

export function makeAlly(inst: ServantInstance, ce?: CraftEssenceDef): AllyUnit {
  const def = getServant(inst.defId);
  const { maxHp, atk } = statsFor(inst);
  const unlocked = unlockedSkills(inst.ascension);
  const skillLv = skillLevelFor(inst.level);
  const ceScale = ceStatScale(inst.level);
  const ceHp = ce ? Math.round(ce.hp * ceScale) : 0;
  const ceAtk = ce ? Math.round(ce.atk * ceScale) : 0;
  return {
    side: 'ally',
    key: inst.uid,
    defId: def.id,
    name: def.name,
    cls: def.cls,
    attribute: def.attribute,
    // CE HP is a battle-only bonus on top of the persistent HP
    maxHp: maxHp + ceHp,
    hp: Math.min(inst.hp, maxHp) + (inst.hp > 0 ? ceHp : 0),
    atk: atk + ceAtk,
    buffs: [],
    np: inst.np ?? 0,
    npLevel: inst.npLevel,
    ascension: inst.ascension,
    skills: def.skills.map((s) => resolveSkill(s, skillLv)),
    cooldowns: def.skills.map((_, i) => (i < unlocked ? 0 : null)),
    npDef: resolveNp(def.np, inst.npLevel),
    npRate: def.npRate,
    npDefRate: def.npDef ?? 3,
    starRate: def.starRate,
    starAbsorb: def.starAbsorb ?? CLASS_STAR_WEIGHT[def.cls],
    hits: def.hits ?? DEFAULT_HITS,
    onEnter: [
      ...(def.passives ?? []).map((p) => ({ source: p.name, effects: p.effects })),
      ...(ce ? [{ source: ce.name, effects: ce.effects }] : []),
    ],
    entered: false,
  };
}

export function ceFor(inst: ServantInstance, ces: { uid: string; defId: string }[]): CraftEssenceDef | undefined {
  const c = inst.ce ? ces.find((x) => x.uid === inst.ce) : undefined;
  return c ? getCraftEssence(c.defId) : undefined;
}

let enemyCounter = 0;

export function makeEnemy(defId: string, level: number): EnemyUnit {
  const def = getEnemy(defId);
  const f = enemyScale(level);
  const maxHp = Math.round(def.hp * f);
  const buffs: Buff[] = (def.passives ?? []).flatMap((p) =>
    p.type === 'buff' ? [{ kind: p.kind, value: p.value, turns: p.turns, times: p.times, source: 'Passive' }] : [],
  );
  const phases = (def.phases ?? []).map((p) => ({ ...p, hp: Math.round(p.hp * f) }));
  return {
    side: 'enemy',
    key: `e${enemyCounter++}_${defId}`,
    defId,
    name: def.name,
    cls: def.cls,
    attribute: def.attribute,
    level,
    maxHp,
    hp: maxHp,
    atk: Math.round(def.atk * f),
    buffs,
    charge: 0,
    chargeMax: def.chargeMax,
    npName: def.npName,
    npMult: def.npMult,
    npAoe: def.npAoe,
    boss: !!def.boss,
    actions: def.actions ?? 1,
    icon: def.icon,
    phases,
    totalBars: phases.length + 1,
  };
}

/** Builds the enemy waves for a node. */
export function generateEncounter(rng: Rng, singularity: number, layer: number, kind: BattleKind): EnemyUnit[][] {
  const sing = SINGULARITIES[singularity];
  const lvl = () => sing.baseLevel + layer + rng.int(0, 2);
  const common = () => makeEnemy(rng.pick(sing.enemies), lvl());

  if (kind === 'boss') {
    const bossLevel = sing.baseLevel + layer + 4;
    const [a, b] = sing.bossEscort;
    return [[makeEnemy(a, bossLevel - 3), makeEnemy(sing.boss, bossLevel), makeEnemy(b, bossLevel - 3)]];
  }
  if (kind === 'elite') {
    return [
      [common(), common()],
      [common(), makeEnemy(rng.pick(sing.elites), lvl() + 3), common()],
    ];
  }
  // First battle of each map: a single gentle wave
  if (layer === 0) return [[common(), common()]];
  const waveCount = rng.chance(0.7) ? 2 : 3;
  const waves: EnemyUnit[][] = [];
  for (let w = 0; w < waveCount; w++) {
    const size = rng.int(2, 3);
    waves.push(Array.from({ length: size }, common));
  }
  return waves;
}
