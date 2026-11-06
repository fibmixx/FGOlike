import { getEnemy } from '@/data/enemies';
import { getServant } from '@/data/servants';
import { SINGULARITIES } from '@/data/singularities';
import { statsFor, unlockedSkills } from '../progression/leveling';
import type { Rng } from '../rng';
import type { AllyUnit, BattleKind, Buff, EnemyUnit, ServantInstance } from '../types';

export function enemyScale(level: number): number {
  return 1 + 0.065 * (level - 1);
}

export function makeAlly(inst: ServantInstance): AllyUnit {
  const def = getServant(inst.defId);
  const { maxHp, atk } = statsFor(inst);
  const unlocked = unlockedSkills(inst.ascension);
  return {
    side: 'ally',
    key: inst.uid,
    defId: def.id,
    name: def.name,
    cls: def.cls,
    attribute: def.attribute,
    maxHp,
    hp: Math.min(inst.hp, maxHp),
    atk,
    buffs: [],
    np: 0,
    npLevel: inst.npLevel,
    ascension: inst.ascension,
    cooldowns: def.skills.map((_, i) => (i < unlocked ? 0 : null)),
    npRate: def.npRate,
    starRate: def.starRate,
  };
}

let enemyCounter = 0;

export function makeEnemy(defId: string, level: number, hpMult = 1): EnemyUnit {
  const def = getEnemy(defId);
  const f = enemyScale(level);
  const maxHp = Math.round(def.hp * f * hpMult);
  const buffs: Buff[] = (def.passives ?? []).flatMap((p) =>
    p.type === 'buff' ? [{ kind: p.kind, value: p.value, turns: p.turns, times: p.times, source: 'Pasiva' }] : [],
  );
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
  };
}

/** Genera las oleadas de un encuentro según la Singularidad y la profundidad en el mapa. */
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
  // Primer combate de cada mapa: una sola oleada suave
  if (layer === 0) return [[common(), common()]];
  const waveCount = rng.chance(0.7) ? 2 : 3;
  const waves: EnemyUnit[][] = [];
  for (let w = 0; w < waveCount; w++) {
    const size = rng.int(2, 3);
    waves.push(Array.from({ length: size }, common));
  }
  return waves;
}
