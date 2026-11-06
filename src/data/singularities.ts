export interface SingularityDef {
  index: number;
  code: string;
  name: string;
  subtitle: string;
  era: string;
  /** Common enemy pool */
  enemies: string[];
  elites: string[];
  boss: string;
  /** Boss escorts */
  bossEscort: string[];
  /** Base enemy level */
  baseLevel: number;
  /** Map theme colours */
  theme: { from: string; to: string; accent: string };
}

export const SINGULARITIES: SingularityDef[] = [
  {
    index: 0, code: 'I', name: 'Orleans', subtitle: "Hundred Years' War of the Evil Dragons", era: 'France, AD 1431',
    enemies: ['skeleton', 'skeleton_archer', 'zombie', 'wyvern'], elites: ['elite_vlad'],
    boss: 'boss_jalter', bossEscort: ['wyvern', 'wyvern'], baseLevel: 4,
    theme: { from: '#2b1a12', to: '#5a2a12', accent: '#ff7a3d' },
  },
  {
    index: 1, code: 'II', name: 'Septem', subtitle: 'Eternal Madness Empire', era: 'Rome, AD 60',
    enemies: ['roman_soldier', 'ghost', 'skeleton', 'wyvern'], elites: ['elite_caligula'],
    boss: 'boss_altera', bossEscort: ['roman_soldier', 'roman_soldier'], baseLevel: 14,
    theme: { from: '#2a0f1b', to: '#5b1730', accent: '#ff5c8a' },
  },
  {
    index: 2, code: 'III', name: 'Okeanos', subtitle: 'Sealed Ends of the Four Seas', era: 'Uncharted Seas, AD 1573',
    enemies: ['pirate', 'sea_serpent', 'ghost', 'skeleton_archer'], elites: ['elite_jason'],
    boss: 'boss_heracles', bossEscort: ['pirate', 'pirate'], baseLevel: 24,
    theme: { from: '#06202e', to: '#0d4560', accent: '#3fd2ff' },
  },
  {
    index: 3, code: 'IV', name: 'London', subtitle: 'Demonic Capital of Death Fog', era: 'London, AD 1888',
    enemies: ['homunculus', 'automaton', 'helter_skelter', 'ghost'], elites: ['elite_mordred'],
    boss: 'boss_alter_lancer', bossEscort: ['helter_skelter', 'homunculus'], baseLevel: 34,
    theme: { from: '#15161c', to: '#353844', accent: '#c9d1ff' },
  },
  {
    index: 4, code: 'V', name: 'E Pluribus Unum', subtitle: 'North American Myth War', era: 'America, AD 1783',
    enemies: ['celtic_warrior', 'ken', 'wyvern', 'automaton'], elites: ['elite_medb'],
    boss: 'boss_cu_alter', bossEscort: ['celtic_warrior', 'ken'], baseLevel: 44,
    theme: { from: '#1d1208', to: '#4a3214', accent: '#ffc44d' },
  },
  {
    index: 5, code: 'VI', name: 'Camelot', subtitle: 'Divine Realm of the Round Table', era: 'Jerusalem, AD 1273',
    enemies: ['knight', 'sphinx', 'skeleton', 'zombie'], elites: ['elite_gawain'],
    boss: 'boss_lion_king', bossEscort: ['knight', 'knight'], baseLevel: 54,
    theme: { from: '#1c1a0c', to: '#5a5220', accent: '#fff1a8' },
  },
  {
    index: 6, code: 'VII', name: 'Babylonia', subtitle: 'Absolute Demonic Front', era: 'Mesopotamia, BC 2655',
    enemies: ['lahmu', 'chimera', 'sphinx', 'wyvern'], elites: ['elite_gorgon'],
    boss: 'boss_tiamat', bossEscort: ['lahmu', 'lahmu'], baseLevel: 64,
    theme: { from: '#0c1a14', to: '#163e2b', accent: '#5dffae' },
  },
  {
    index: 7, code: 'FINAL', name: 'Solomon', subtitle: 'Grand Time Temple', era: 'The End of Time',
    enemies: ['demon_pillar_minor', 'lahmu', 'chimera', 'helter_skelter'], elites: ['elite_pillar'],
    boss: 'boss_goetia', bossEscort: ['demon_pillar_minor', 'demon_pillar_minor'], baseLevel: 74,
    theme: { from: '#160814', to: '#3d0f2c', accent: '#ff3d6e' },
  },
];
