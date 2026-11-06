import type { EnemyDef } from '@/game/types';

const e = (
  id: string, name: string, cls: EnemyDef['cls'], attribute: EnemyDef['attribute'],
  hp: number, atk: number, icon: string, extra: Partial<EnemyDef> = {},
): EnemyDef => ({
  id, name, cls, attribute, hp, atk, icon,
  chargeMax: 3, npName: 'Ataque Especial', npMult: 2.5, npAoe: false,
  ...extra,
});

// Stats base a nivel 1. Escalan con enemyScale(level) en combat/factory.ts.
export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    // Comunes
    e('skeleton', 'Esqueleto', 'Saber', 'Earth', 1500, 520, '💀'),
    e('skeleton_archer', 'Esqueleto Arquero', 'Archer', 'Earth', 1300, 560, '🦴'),
    e('zombie', 'Zombi', 'Assassin', 'Earth', 1700, 480, '🧟'),
    e('wyvern', 'Wyvern', 'Rider', 'Beast', 2100, 600, '🐉', { chargeMax: 4 }),
    e('ghost', 'Fantasma', 'Caster', 'Sky', 1400, 560, '👻'),
    e('roman_soldier', 'Soldado Romano', 'Lancer', 'Man', 1800, 560, '🛡'),
    e('pirate', 'Pirata', 'Saber', 'Man', 1700, 580, '🏴‍☠️'),
    e('sea_serpent', 'Serpiente Marina', 'Rider', 'Beast', 2300, 600, '🐍', { chargeMax: 4 }),
    e('homunculus', 'Homúnculo', 'Caster', 'Man', 1500, 600, '🧪'),
    e('automaton', 'Autómata', 'Lancer', 'Earth', 2000, 560, '⚙'),
    e('helter_skelter', 'Helter Skelter', 'Saber', 'Earth', 2200, 620, '🤖'),
    e('celtic_warrior', 'Guerrero Celta', 'Lancer', 'Man', 1900, 620, '🗡'),
    e('ken', 'Ken (Celta)', 'Berserker', 'Man', 1500, 580, '😤'),
    e('knight', 'Caballero del Rey León', 'Saber', 'Man', 2100, 640, '🛡'),
    e('sphinx', 'Esfinge', 'Caster', 'Beast', 2600, 620, '🦁', { chargeMax: 4 }),
    e('lahmu', 'Lahmu', 'Assassin', 'Beast', 1900, 680, '🦂'),
    e('chimera', 'Quimera', 'Berserker', 'Beast', 2000, 640, '🐲', { chargeMax: 4 }),
    e('demon_pillar_minor', 'Fragmento de Pilar Demoníaco', 'Caster', 'Beast', 2600, 700, '👁', { chargeMax: 4 }),

    // Élites (Servants enemigos de las singularidades)
    e('elite_vlad', 'Vlad III (Berserker)', 'Berserker', 'Earth', 4200, 700, '🩸', { chargeMax: 3, npName: 'Kazikli Bey', npMult: 3 }),
    e('elite_caligula', 'Calígula', 'Berserker', 'Man', 4400, 700, '🌙', { npName: 'Flucticulus Diana', npMult: 3 }),
    e('elite_jason', 'Jasón', 'Saber', 'Man', 4000, 650, '⛵', { npName: 'Argonauts', npMult: 3, npAoe: true }),
    e('elite_mordred', 'Mordred', 'Saber', 'Earth', 4500, 760, '⚡', { npName: 'Clarent Blood Arthur', npMult: 3, npAoe: true }),
    e('elite_medb', 'Medb', 'Rider', 'Earth', 4200, 700, '👑', { npName: 'Chariot My Love', npMult: 3 }),
    e('elite_gawain', 'Gawain', 'Saber', 'Earth', 5000, 760, '☀', { npName: 'Excalibur Galatine', npMult: 3, npAoe: true }),
    e('elite_gorgon', 'Gorgona', 'Avenger', 'Earth', 5200, 780, '🐍', { npName: 'Pandemonium Cetus', npMult: 3, npAoe: true }),
    e('elite_pillar', 'Pilar Demoníaco', 'Caster', 'Beast', 5800, 800, '👁', { npName: 'Rayo de Incineración', npMult: 3, npAoe: true }),

    // Jefes de Singularidad
    e('boss_jalter', 'Jeanne d\'Arc (Alter)', 'Avenger', 'Man', 10500, 680, '🔥', {
      boss: true, actions: 2, chargeMax: 3, npName: 'La Grondement du Haine', npMult: 3.2, npAoe: true,
    }),
    e('boss_altera', 'Altera', 'Saber', 'Earth', 15500, 800, '🌌', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Photon Ray', npMult: 3.5, npAoe: true,
    }),
    e('boss_heracles', 'Heracles (Argonautas)', 'Berserker', 'Sky', 16000, 820, '🦁', {
      boss: true, actions: 2, chargeMax: 4, npName: 'Nine Lives', npMult: 3.5, npAoe: false,
      passives: [{ type: 'buff', target: 'self', kind: 'guts', value: 0.3, turns: -1, times: 1 }],
    }),
    e('boss_alter_lancer', 'Artoria (Lancer Alter)', 'Lancer', 'Sky', 21000, 880, '🌑', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Rhongomyniad', npMult: 3.5, npAoe: true,
    }),
    e('boss_cu_alter', 'Cú Chulainn (Alter)', 'Berserker', 'Sky', 20000, 900, '🦈', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Curruid Coinchenn', npMult: 4, npAoe: false,
    }),
    e('boss_lion_king', 'El Rey León', 'Lancer', 'Sky', 26000, 920, '🦁', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Rhongomyniad (Lanza Sagrada)', npMult: 3.5, npAoe: true,
      passives: [{ type: 'buff', target: 'self', kind: 'defUp', value: 0.15, turns: -1 }],
    }),
    e('boss_tiamat', 'Tiamat', 'Avenger', 'Beast', 30000, 950, '🌊', {
      boss: true, actions: 3, chargeMax: 4, npName: 'Nahrmalbash', npMult: 3.5, npAoe: true,
      passives: [{ type: 'buff', target: 'self', kind: 'guts', value: 0.25, turns: -1, times: 1 }],
    }),
    e('boss_goetia', 'Rey Demonio Goetia', 'Caster', 'Beast', 36000, 1000, '👁‍🗨', {
      boss: true, actions: 3, chargeMax: 3, npName: 'Ars Almadel Salomonis', npMult: 4, npAoe: true,
      passives: [{ type: 'buff', target: 'self', kind: 'guts', value: 0.3, turns: -1, times: 1 }],
    }),
  ].map((d) => [d.id, d]),
);

export function getEnemy(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Enemigo desconocido: ${id}`);
  return d;
}
