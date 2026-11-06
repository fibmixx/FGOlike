import type { Effect, EnemyDef } from '@/game/types';

const e = (
  id: string, name: string, cls: EnemyDef['cls'], attribute: EnemyDef['attribute'],
  hp: number, atk: number, icon: string, extra: Partial<EnemyDef> = {},
): EnemyDef => ({
  id, name, cls, attribute, hp, atk, icon,
  chargeMax: 3, npName: 'Special Attack', npMult: 2.5, npAoe: false,
  ...extra,
});

const selfBuff = (kind: Extract<Effect, { type: 'buff' }>['kind'], value: number, turns = -1, times?: number): Effect =>
  ({ type: 'buff', target: 'self', kind, value, turns, ...(times !== undefined && { times }) });

// Base stats at level 1; scaled by enemyScale(level) in combat/factory.ts.
export const ENEMIES: Record<string, EnemyDef> = Object.fromEntries(
  [
    // Commons
    e('skeleton', 'Skeleton', 'Saber', 'Earth', 1500, 520, '💀'),
    e('skeleton_archer', 'Skeleton Archer', 'Archer', 'Earth', 1300, 560, '🦴'),
    e('zombie', 'Zombie', 'Assassin', 'Earth', 1700, 480, '🧟'),
    e('wyvern', 'Wyvern', 'Rider', 'Beast', 2100, 600, '🐉', { chargeMax: 4 }),
    e('ghost', 'Ghost', 'Caster', 'Sky', 1400, 560, '👻'),
    e('roman_soldier', 'Roman Soldier', 'Lancer', 'Man', 1800, 560, '🛡'),
    e('pirate', 'Pirate', 'Saber', 'Man', 1700, 580, '🏴‍☠️'),
    e('sea_serpent', 'Sea Serpent', 'Rider', 'Beast', 2300, 600, '🐍', { chargeMax: 4 }),
    e('homunculus', 'Homunculus', 'Caster', 'Man', 1500, 600, '🧪'),
    e('automaton', 'Automaton', 'Lancer', 'Earth', 2000, 560, '⚙'),
    e('helter_skelter', 'Helter Skelter', 'Saber', 'Earth', 2200, 620, '🤖'),
    e('celtic_warrior', 'Celtic Warrior', 'Lancer', 'Man', 1900, 620, '🗡'),
    e('ken', 'Ken (Celtic)', 'Berserker', 'Man', 1500, 580, '😤'),
    e('knight', 'Knight of the Lion King', 'Saber', 'Man', 2100, 640, '🛡'),
    e('sphinx', 'Sphinx', 'Caster', 'Beast', 2600, 620, '🦁', { chargeMax: 4 }),
    e('lahmu', 'Lahmu', 'Assassin', 'Beast', 1900, 680, '🦂'),
    e('chimera', 'Chimera', 'Berserker', 'Beast', 2000, 640, '🐲', { chargeMax: 4 }),
    e('demon_pillar_minor', 'Demon Pillar Fragment', 'Caster', 'Beast', 2600, 700, '👁', { chargeMax: 4 }),

    // Elites (enemy Servants of each Singularity)
    e('elite_vlad', 'Vlad III (Berserker)', 'Berserker', 'Earth', 4200, 700, '🩸', { npName: 'Kazikli Bey', npMult: 3 }),
    e('elite_caligula', 'Caligula', 'Berserker', 'Man', 4400, 700, '🌙', { npName: 'Flucticulus Diana', npMult: 3 }),
    e('elite_jason', 'Jason', 'Saber', 'Man', 4000, 650, '⛵', { npName: 'Argonauts', npMult: 3, npAoe: true }),
    e('elite_mordred', 'Mordred', 'Saber', 'Earth', 4500, 760, '⚡', { npName: 'Clarent Blood Arthur', npMult: 3, npAoe: true }),
    e('elite_medb', 'Medb', 'Rider', 'Earth', 4200, 700, '👑', { npName: 'Chariot My Love', npMult: 3 }),
    e('elite_gawain', 'Gawain', 'Saber', 'Earth', 5000, 760, '☀', { npName: 'Excalibur Galatine', npMult: 3, npAoe: true }),
    e('elite_gorgon', 'Gorgon', 'Avenger', 'Earth', 5200, 780, '🐍', { npName: 'Pandemonium Cetus', npMult: 3, npAoe: true }),
    e('elite_pillar', 'Demon God Pillar', 'Caster', 'Beast', 5800, 800, '👁', { npName: 'Incineration Ray', npMult: 3, npAoe: true }),

    // Singularity bosses — each bar after the first is a phase
    e('boss_jalter', "Jeanne d'Arc (Alter)", 'Avenger', 'Man', 6500, 680, '🔥', {
      boss: true, actions: 2, chargeMax: 3, npName: 'La Grondement du Haine', npMult: 3.2, npAoe: true,
      phases: [{ hp: 5000, text: 'The Dragon Witch unleashes her hatred!', effects: [selfBuff('atkUp', 0.2)] }],
    }),
    e('boss_altera', 'Altera', 'Saber', 'Earth', 9000, 800, '🌌', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Photon Ray', npMult: 3.5, npAoe: true,
      phases: [{ hp: 7000, text: 'The Scourge of God awakens the Sword of Mars.', effects: [selfBuff('defUp', 0.2), selfBuff('npDmgUp', 0.3)] }],
    }),
    e('boss_heracles', 'Heracles (Argonauts)', 'Berserker', 'Sky', 9000, 820, '🦁', {
      boss: true, actions: 2, chargeMax: 4, npName: 'Nine Lives', npMult: 3.5,
      passives: [selfBuff('guts', 0.3, -1, 1)],
      phases: [{ hp: 7000, text: 'God Hand! The twelve trials refuse to end.', effects: [selfBuff('guts', 0.3, -1, 1), selfBuff('atkUp', 0.3)] }],
    }),
    e('boss_alter_lancer', 'Altria (Lancer Alter)', 'Lancer', 'Sky', 11000, 880, '🌑', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Rhongomyniad', npMult: 3.5, npAoe: true,
      phases: [{ hp: 9000, text: 'The storm of the Holy Lance rages.', effects: [selfBuff('defUp', 0.25)], fullCharge: true }],
    }),
    e('boss_cu_alter', 'Cú Chulainn (Alter)', 'Berserker', 'Sky', 11000, 900, '🦈', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Curruid Coinchenn', npMult: 4,
      phases: [{ hp: 9000, text: 'He dons the bones of the sea beast Coinchenn.', effects: [selfBuff('defUp', 0.3), selfBuff('atkUp', 0.2)] }],
    }),
    e('boss_lion_king', 'The Lion King', 'Lancer', 'Sky', 11000, 920, '🦁', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Rhongomyniad (Holy Lance)', npMult: 3.5, npAoe: true,
      passives: [selfBuff('defUp', 0.15)],
      phases: [
        { hp: 9000, text: 'The Holy Lance shines over the Holy Land.', effects: [selfBuff('atkUp', 0.2)], fullCharge: true },
        { hp: 8000, text: 'The Goddess of the Lance descends.', effects: [selfBuff('npDmgUp', 0.4)], actions: 3 },
      ],
    }),
    e('boss_tiamat', 'Tiamat', 'Beast', 'Beast', 13000, 950, '🌊', {
      boss: true, actions: 2, chargeMax: 4, npName: 'Nahrmalbash', npMult: 3.5, npAoe: true,
      phases: [
        { hp: 11000, text: 'The Sea of Life spreads across Babylonia.', effects: [selfBuff('regen', 0.03)] },
        { hp: 10000, text: 'Beast II: Mother of all life, Tiamat.', effects: [selfBuff('atkUp', 0.3), selfBuff('defUp', 0.2)], actions: 3, fullCharge: true },
      ],
    }),
    e('boss_goetia', 'Demon King Goetia', 'Beast', 'Beast', 15000, 1000, '👁‍🗨', {
      boss: true, actions: 2, chargeMax: 3, npName: 'Ars Almadel Salomonis', npMult: 4, npAoe: true,
      phases: [
        { hp: 12000, text: 'The Temple of Time begins to burn.', effects: [selfBuff('atkUp', 0.25)], fullCharge: true },
        { hp: 11000, text: 'Beast I: the Demon King reveals his true form.', effects: [selfBuff('defUp', 0.25), selfBuff('npDmgUp', 0.5)], actions: 3 },
      ],
    }),
  ].map((d) => [d.id, d]),
);

export function getEnemy(id: string): EnemyDef {
  const d = ENEMIES[id];
  if (!d) throw new Error(`Unknown enemy: ${id}`);
  return d;
}
