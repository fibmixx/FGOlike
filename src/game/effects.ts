// Scaling (skill level / NP level) and human-readable text for effects.
import { BUFF_LABEL } from './constants';
import type { Effect, NoblePhantasmDef, SkillDef, TargetSpec } from './types';

const lerp = (a: number, b: number | undefined, t: number) => (b === undefined ? a : a + (b - a) * t);
const round = (v: number, d = 1000) => Math.round(v * d) / d;

/** t in [0,1]: 0 = level 1, 1 = level 10 (skills) or NP5. */
export function scaleEffect(e: Effect, t: number): Effect {
  switch (e.type) {
    case 'buff': return { ...e, value: round(lerp(e.value, e.max, t)), max: undefined };
    case 'heal':
    case 'np':
      return { ...e, amount: round(lerp(e.amount, e.max, t)), max: undefined };
    case 'stars':
    case 'chargeDown':
      return { ...e, amount: Math.round(lerp(e.amount, e.max, t)), max: undefined };
    default: return e;
  }
}

export function resolveSkill(skill: SkillDef, skillLevel: number): SkillDef {
  const t = (skillLevel - 1) / 9;
  return {
    ...skill,
    cooldown: Math.round(lerp(skill.cooldown, skill.cooldownMax, t)),
    cooldownMax: undefined,
    effects: skill.effects.map((e) => scaleEffect(e, t)),
  };
}

export function resolveNp(np: NoblePhantasmDef, npLevel: number): NoblePhantasmDef {
  const t = (npLevel - 1) / 4;
  return {
    ...np,
    multiplier: round(lerp(np.multiplier, np.multiplierMax, t)),
    multiplierMax: undefined,
    pre: np.pre?.map((e) => scaleEffect(e, t)),
    post: np.post?.map((e) => scaleEffect(e, t)),
  };
}

// ─── Text ───────────────────────────────────────────────────

const WHO: Record<TargetSpec, string> = {
  self: 'self', ally: 'one ally', allies: 'party', others: 'other allies', enemy: 'one enemy', enemies: 'all enemies',
};
const pct = (v: number) => `${Math.round(v * 100)}%`;
const range = (a: number, b: number | undefined, f: (v: number) => string) =>
  b === undefined || Math.abs(a - b) < 1e-9 ? f(a) : `${f(a)}→${f(b)}`;

export function describeEffect(e: Effect): string {
  switch (e.type) {
    case 'buff': {
      const label = BUFF_LABEL[e.kind];
      const turns = e.turns < 0 ? '' : ` (${e.turns}T${e.times ? `, ${e.times}×` : ''})`;
      const chance = e.chance !== undefined && e.chance < 1 ? ` [${pct(e.chance)} chance]` : '';
      let val = '';
      switch (e.kind) {
        case 'evade': case 'invincible': case 'taunt': case 'stun': val = ''; break;
        case 'guts': val = ` ${range(e.value, e.max, pct)} HP`; break;
        case 'npRegen': val = ` ${range(e.value, e.max, (v) => `${Math.round(v)}%`)}/turn`; break;
        case 'starRegen': val = ` ${range(e.value, e.max, (v) => `${Math.round(v)}`)}/turn`; break;
        case 'regen': val = ` ${range(e.value, e.max, pct)}/turn`; break;
        case 'dmgCut': case 'dot': val = ` ${range(e.value, e.max, (v) => `${Math.round(v)}`)}`; break;
        default: val = ` ${range(e.value, e.max, pct)}`;
      }
      return `${label}${val} to ${WHO[e.target]}${turns}${chance}`;
    }
    case 'heal': return `Restore ${range(e.amount, e.max, pct)} HP to ${WHO[e.target]}`;
    case 'np': return `Charge ${WHO[e.target]}'s NP by ${range(e.amount, e.max, (v) => `${Math.round(v)}%`)}`;
    case 'stars': return `Gain ${range(e.amount, e.max, (v) => `${Math.round(v)}`)} critical stars`;
    case 'chargeDown': return `Reduce ${WHO[e.target]}'s charge by ${e.amount}`;
    case 'cleanse': return `Remove debuffs from ${WHO[e.target]}`;
    case 'dispel': return `Remove buffs from ${WHO[e.target]}`;
  }
}

export function describeEffects(effects: Effect[] = []): string[] {
  return effects.map(describeEffect);
}

export function describeNp(np: NoblePhantasmDef): string[] {
  const out = describeEffects(np.pre);
  if (np.kind !== 'support') {
    out.push(`Deal ${range(np.multiplier, np.multiplierMax, pct)} damage to ${np.kind === 'aoe' ? 'all enemies' : 'one enemy'}`);
  }
  return [...out, ...describeEffects(np.post)];
}
