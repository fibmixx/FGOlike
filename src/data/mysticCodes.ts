import type { SkillDef } from '@/game/types';

/** Mystic Code inicial: Uniforme de Caldea (habilidades del Master). */
export const CHALDEA_UNIFORM: { name: string; skills: SkillDef[] } = {
  name: 'Uniforme de Caldea',
  skills: [
    {
      id: 'mc_heal', name: 'Primeros Auxilios', cooldown: 6,
      description: 'Aliado: cura un 30% de su vida.',
      effects: [{ type: 'heal', target: 'ally', amount: 0.3 }],
    },
    {
      id: 'mc_boost', name: 'Refuerzo Instantáneo', cooldown: 7,
      description: 'Aliado: ATK +50% (1 turno).',
      effects: [{ type: 'buff', target: 'ally', kind: 'atkUp', value: 0.5, turns: 1 }],
    },
    {
      id: 'mc_gandr', name: 'Gandr', cooldown: 8,
      description: 'Aturde a un enemigo (1 turno).',
      effects: [{ type: 'buff', target: 'enemy', kind: 'stun', value: 1, turns: 1 }],
    },
  ],
};
