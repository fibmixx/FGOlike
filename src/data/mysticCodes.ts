import type { SkillDef } from '@/game/types';

/** Starting Mystic Code. Each skill can be used once per Singularity. */
export const CHALDEA_UNIFORM: { name: string; skills: SkillDef[] } = {
  name: 'Chaldea Uniform',
  skills: [
    { id: 'mc_heal', name: 'First Aid', cooldown: 0, effects: [{ type: 'heal', target: 'ally', amount: 0.4 }] },
    { id: 'mc_boost', name: 'Instant Enhancement', cooldown: 0, effects: [{ type: 'buff', target: 'ally', kind: 'atkUp', value: 0.5, turns: 1 }] },
    { id: 'mc_gandr', name: 'Gandr', cooldown: 0, effects: [{ type: 'buff', target: 'enemy', kind: 'stun', value: 1, turns: 1 }] },
  ],
};
