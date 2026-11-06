import type { BuffKind, Effect, ServantDef, SkillDef, TargetSpec } from '@/game/types';

// Helpers para escribir datos de forma compacta
const buff = (target: TargetSpec, kind: BuffKind, value: number, turns: number, times?: number): Effect =>
  ({ type: 'buff', target, kind, value, turns, times });
const heal = (target: TargetSpec, amount: number): Effect => ({ type: 'heal', target, amount });
const np = (target: TargetSpec, amount: number): Effect => ({ type: 'np', target, amount });
const stars = (amount: number): Effect => ({ type: 'stars', amount });
const chargeDown = (target: TargetSpec, amount = 1): Effect => ({ type: 'chargeDown', target, amount });
const cleanse = (target: TargetSpec): Effect => ({ type: 'cleanse', target });
const skill = (id: string, name: string, cooldown: number, description: string, effects: Effect[]): SkillDef =>
  ({ id, name, cooldown, description, effects });

// Skills comunes reutilizadas
const charisma = (rank: string, v: number) =>
  skill('charisma', `Carisma ${rank}`, 7, `ATK del equipo +${v * 100}% (3 turnos).`, [buff('allies', 'atkUp', v, 3)]);
const goldenRule = (rank: string, v: number) =>
  skill('golden_rule', `Regla de Oro ${rank}`, 7, `Ganancia de NP propia +${v * 100}% (3 turnos).`, [buff('self', 'npGainUp', v, 3)]);

export const SERVANTS: ServantDef[] = [
  // ───────── Shielder ─────────
  {
    id: 'mash', name: 'Mash Kyrielight', cls: 'Shielder', rarity: 3, attribute: 'Earth',
    hp: [2100, 12000], atk: [1300, 7800], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.84, starRate: 0.1, noGacha: true,
    lore: 'Demi-Servant y kouhai de Chaldea. Siempre a tu lado desde el principio.',
    skills: [
      skill('wall_snow', 'Muro Transitorio de Nieve', 7, 'DEF del equipo +20% (3 turnos).', [buff('allies', 'defUp', 0.2, 3)]),
      skill('wall_chalk', 'Muro Oscuro de Tiza', 7, 'Aliado: Invencible 1 vez (1 turno) y NP +10.', [buff('ally', 'invincible', 1, 1, 1), np('ally', 10)]),
      skill('rousing', 'Escudo de Resolución', 7, 'Provocación (3 turnos) y Ganancia NP +50% (3 turnos).', [buff('self', 'taunt', 1, 3), buff('self', 'npGainUp', 0.5, 3)]),
    ],
    np: {
      name: 'Lord Chaldeas', title: 'Ciudadela de los Señores', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
      description: 'DEF del equipo +30% (3 turnos) y ATK +10% (3 turnos).',
      post: [buff('allies', 'defUp', 0.3, 3), buff('allies', 'atkUp', 0.1, 3)],
    },
  },
  // ───────── Saber ─────────
  {
    id: 'artoria', name: 'Artoria Pendragon', cls: 'Saber', rarity: 5, attribute: 'Earth',
    hp: [2200, 15150], atk: [1730, 11220], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.86, starRate: 0.1,
    lore: 'El Rey de los Caballeros, portadora de la espada sagrada.',
    skills: [
      charisma('B', 0.18),
      skill('mana_burst', 'Estallido de Maná A', 6, 'Buster propio +50% (1 turno).', [buff('self', 'busterUp', 0.5, 1)]),
      skill('instinct', 'Instinto A', 6, 'Gana 15 estrellas.', [stars(15)]),
    ],
    np: {
      name: 'Excalibur', title: 'Espada Prometida de la Victoria', card: 'Buster', kind: 'aoe', multiplier: 4.0, hits: 1,
      description: 'Gran daño a todos los enemigos. Después: NP propio +20.', post: [np('self', 20)],
    },
  },
  {
    id: 'siegfried', name: 'Siegfried', cls: 'Saber', rarity: 4, attribute: 'Earth',
    hp: [2000, 12300], atk: [1500, 9120], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.83, starRate: 0.1,
    lore: 'El héroe que bañó su cuerpo en sangre de dragón.',
    skills: [
      goldenRule('C-', 0.2),
      skill('disengage', 'Retirada A', 6, 'Cura un 25% de su vida y elimina debuffs.', [heal('self', 0.25), cleanse('self')]),
      skill('dragon_blood', 'Armadura de Sangre de Dragón', 7, 'DEF propia +30% y Provocación (3 turnos).', [buff('self', 'defUp', 0.3, 3), buff('self', 'taunt', 1, 3)]),
    ],
    np: {
      name: 'Balmung', title: 'Crepúsculo del Fantasma Maldito', card: 'Buster', kind: 'aoe', multiplier: 3.5, hits: 1,
      description: 'Daño a todos los enemigos.',
    },
  },
  {
    id: 'nero', name: 'Nero Claudius', cls: 'Saber', rarity: 4, attribute: 'Man',
    hp: [1900, 11900], atk: [1550, 9405], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.84, starRate: 0.1,
    lore: 'La emperatriz de Roma. ¡Umu!',
    skills: [
      skill('imperial', 'Privilegio Imperial EX', 6, 'Cura un 30% y ATK +20% (3 turnos).', [heal('self', 0.3), buff('self', 'atkUp', 0.2, 3)]),
      skill('invictus', 'Invictus Spiritus A', 8, 'Guts: revive con 30% de vida (5 turnos, 1 vez).', [buff('self', 'guts', 0.3, 5, 1)]),
      skill('nero_charisma', 'Carisma C', 7, 'ATK del equipo +15% (3 turnos) y NP propio +20.', [buff('allies', 'atkUp', 0.15, 3), np('self', 20)]),
    ],
    np: {
      name: 'Aestus Domus Aurea', title: 'Teatro del Esplendor Dorado', card: 'Buster', kind: 'single', multiplier: 6.0, hits: 3,
      description: 'Daño enorme a un enemigo y DEF del objetivo -20% (3 turnos).', pre: [buff('enemy', 'defDown', 0.2, 3)],
    },
  },
  // ───────── Archer ─────────
  {
    id: 'emiya', name: 'EMIYA', cls: 'Archer', rarity: 4, attribute: 'Man',
    hp: [1950, 11400], atk: [1600, 9500], deck: ['Quick', 'Arts', 'Arts', 'Arts', 'Buster'],
    npRate: 0.88, starRate: 0.08,
    lore: 'Un héroe sin nombre que forja espadas con su mente.',
    skills: [
      skill('minds_eye', 'Ojo de la Mente (Verdadero) B', 7, 'Evasión (1 turno) y DEF +18% (3 turnos).', [buff('self', 'evade', 1, 1, 1), buff('self', 'defUp', 0.18, 3)]),
      skill('clairvoyance', 'Clarividencia C', 6, 'Generación de estrellas +30% (3 turnos).', [buff('self', 'starGenUp', 0.3, 3)]),
      skill('projection', 'Proyección A', 6, 'Arts propio +50% (1 turno).', [buff('self', 'artsUp', 0.5, 1)]),
    ],
    np: {
      name: 'Unlimited Blade Works', title: 'Ilimitadas Obras de Espadas', card: 'Arts', kind: 'aoe', multiplier: 4.5, hits: 10,
      description: 'Daño a todos los enemigos y ATK propio +20% (3 turnos).', pre: [buff('self', 'atkUp', 0.2, 3)],
    },
  },
  {
    id: 'gilgamesh', name: 'Gilgamesh', cls: 'Archer', rarity: 5, attribute: 'Sky',
    hp: [1900, 13100], atk: [1890, 12280], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.34, starRate: 0.08,
    lore: 'El Rey de los Héroes. Todo tesoro del mundo le pertenece.',
    skills: [
      charisma('A+', 0.21),
      goldenRule('A', 0.5),
      skill('collector', 'Coleccionista EX', 6, 'Gana 20 estrellas.', [stars(20)]),
    ],
    np: {
      name: 'Enuma Elish', title: 'La Estrella que Separó Cielo y Tierra', card: 'Buster', kind: 'aoe', multiplier: 4.5, hits: 1,
      description: 'Daño masivo a todos los enemigos. Antes: Daño NP +30% (1 turno).', pre: [buff('self', 'npDmgUp', 0.3, 1)],
    },
  },
  {
    id: 'robin', name: 'Robin Hood', cls: 'Archer', rarity: 3, attribute: 'Earth',
    hp: [1700, 10200], atk: [1200, 7600], deck: ['Quick', 'Quick', 'Arts', 'Arts', 'Buster'],
    npRate: 0.87, starRate: 0.08,
    lore: 'El arquero sin rostro de Sherwood.',
    skills: [
      skill('sabotage', 'Sabotaje A', 6, 'ATK de todos los enemigos -15% (3 turnos).', [buff('enemies', 'atkDown', 0.15, 3)]),
      goldenRule('E', 0.18),
      skill('may_king', 'Rey de Mayo B', 7, 'Evasión (1 turno) y estrellas +30% (3 turnos).', [buff('self', 'evade', 1, 1, 1), buff('self', 'starGenUp', 0.3, 3)]),
    ],
    np: {
      name: 'Yew Bow', title: 'Arco del Tejo', card: 'Arts', kind: 'single', multiplier: 6.0, hits: 1,
      description: 'Gran daño a un enemigo y DEF del objetivo -20% (3 turnos).', post: [buff('enemy', 'defDown', 0.2, 3)],
    },
  },
  // ───────── Lancer ─────────
  {
    id: 'cu', name: 'Cú Chulainn', cls: 'Lancer', rarity: 3, attribute: 'Sky',
    hp: [1700, 10600], atk: [1300, 7500], deck: ['Quick', 'Quick', 'Arts', 'Buster', 'Buster'],
    npRate: 1.07, starRate: 0.12,
    lore: 'El Perro de Ulster. Duro de matar.',
    skills: [
      skill('battle_cont', 'Continuación de Batalla A', 8, 'Guts: revive con 30% de vida (5 turnos, 1 vez).', [buff('self', 'guts', 0.3, 5, 1)]),
      skill('arrows', 'Protección contra Flechas B', 7, 'Evasión 3 veces (3 turnos).', [buff('self', 'evade', 1, 3, 3)]),
      skill('cu_disengage', 'Retirada C', 6, 'Cura un 20% de su vida y elimina debuffs.', [heal('self', 0.2), cleanse('self')]),
    ],
    np: {
      name: 'Gáe Bolg', title: 'Lanza Perforante de la Muerte', card: 'Buster', kind: 'single', multiplier: 6.0, hits: 1,
      description: 'Gran daño a un enemigo y DEF del objetivo -20% (3 turnos).', post: [buff('enemy', 'defDown', 0.2, 3)],
    },
  },
  {
    id: 'scathach', name: 'Scáthach', cls: 'Lancer', rarity: 5, attribute: 'Star',
    hp: [2200, 14800], atk: [1750, 11320], deck: ['Quick', 'Quick', 'Arts', 'Buster', 'Buster'],
    npRate: 0.71, starRate: 0.12,
    lore: 'La reina de la Tierra de las Sombras, maestra de héroes.',
    skills: [
      skill('dun_scaith', 'Sabiduría de Dun Scáith A+', 7, 'Estrellas +40% y Evasión (1 turno).', [buff('self', 'starGenUp', 0.4, 3), buff('self', 'evade', 1, 1, 1)]),
      skill('rune', 'Runa Primordial', 6, 'Quick propio +50% (1 turno).', [buff('self', 'quickUp', 0.5, 1)]),
      skill('godslayer', 'Asesina de Dioses B', 7, 'Crítico +50% (3 turnos).', [buff('self', 'critUp', 0.5, 3)]),
    ],
    np: {
      name: 'Gáe Bolg Alternative', title: 'Lanza Perforante de la Muerte (Alt.)', card: 'Quick', kind: 'single', multiplier: 12.0, hits: 2,
      description: 'Daño devastador a un enemigo.',
    },
  },
  {
    id: 'leonidas', name: 'Leonidas I', cls: 'Lancer', rarity: 2, attribute: 'Man',
    hp: [1650, 9300], atk: [1100, 6300], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.86, starRate: 0.12,
    lore: 'El rey de Esparta. ¡Esta es Esparta!',
    skills: [
      skill('warrior_battle', 'Grito de Batalla B', 7, 'Buster del equipo +20% (3 turnos).', [buff('allies', 'busterUp', 0.2, 3)]),
      skill('rearguard', 'Retaguardia A', 7, 'Provocación y DEF +30% (3 turnos).', [buff('self', 'taunt', 1, 3), buff('self', 'defUp', 0.3, 3)]),
      skill('leo_cont', 'Continuación de Batalla A', 8, 'Guts: revive con 30% de vida (5 turnos, 1 vez).', [buff('self', 'guts', 0.3, 5, 1)]),
    ],
    np: {
      name: 'Thermopylae Enomotia', title: 'Guerreros de las Termópilas', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
      description: 'Provocación (1 turno), DEF +50% (3 turnos) y NP del equipo +10.',
      post: [buff('self', 'taunt', 1, 1), buff('self', 'defUp', 0.5, 3), np('allies', 10)],
    },
  },
  // ───────── Rider ─────────
  {
    id: 'medusa', name: 'Medusa', cls: 'Rider', rarity: 3, attribute: 'Earth',
    hp: [1600, 9500], atk: [1300, 7900], deck: ['Quick', 'Quick', 'Arts', 'Arts', 'Buster'],
    npRate: 0.58, starRate: 0.09,
    lore: 'La Gorgona de los ojos petrificantes.',
    skills: [
      skill('mystic_eyes', 'Ojos Místicos A+', 8, 'Aturde a un enemigo (1 turno).', [buff('enemy', 'stun', 1, 1)]),
      skill('monstrous', 'Fuerza Monstruosa B', 7, 'ATK propio +30% (2 turnos).', [buff('self', 'atkUp', 0.3, 2)]),
      skill('blood_fort', 'Fortaleza de Sangre', 7, 'Gana 15 estrellas y NP propio +20.', [stars(15), np('self', 20)]),
    ],
    np: {
      name: 'Bellerophon', title: 'Brida del Caballero Dorado', card: 'Quick', kind: 'aoe', multiplier: 4.0, hits: 5,
      description: 'Daño a todos los enemigos y estrellas +15.', post: [stars(15)],
    },
  },
  {
    id: 'iskandar', name: 'Iskandar', cls: 'Rider', rarity: 5, attribute: 'Man',
    hp: [2000, 13400], atk: [1650, 10900], deck: ['Quick', 'Quick', 'Arts', 'Buster', 'Buster'],
    npRate: 0.59, starRate: 0.09,
    lore: 'El Rey de los Conquistadores. ¡Avanza hacia los confines del mundo!',
    skills: [
      charisma('A', 0.2),
      skill('tactics', 'Táctica Militar B', 7, 'Daño NP del equipo +20% (1 turno).', [buff('allies', 'npDmgUp', 0.2, 1)]),
      skill('iskandar_rule', 'Regla de Oro A', 7, 'Ganancia de NP propia +50% (3 turnos) y NP +20.', [buff('self', 'npGainUp', 0.5, 3), np('self', 20)]),
    ],
    np: {
      name: 'Ionioi Hetairoi', title: 'Ejército del Rey', card: 'Buster', kind: 'aoe', multiplier: 4.0, hits: 10,
      description: 'Daño a todos los enemigos con 10 golpes.',
    },
  },
  {
    id: 'drake', name: 'Francis Drake', cls: 'Rider', rarity: 5, attribute: 'Star',
    hp: [2100, 13500], atk: [1640, 11300], deck: ['Quick', 'Quick', 'Arts', 'Buster', 'Buster'],
    npRate: 0.61, starRate: 0.09,
    lore: 'La pirata que dio la vuelta al mundo y quemó la Armada.',
    skills: [
      skill('storm', 'Viajera de la Tormenta A+', 7, 'ATK del equipo +15% (3 turnos) y NP del equipo +10.', [buff('allies', 'atkUp', 0.15, 3), np('allies', 10)]),
      goldenRule('B', 0.4),
      skill('pioneer', 'Pionera de las Estrellas EX', 8, 'NP propio +30 y estrellas +10.', [np('self', 30), stars(10)]),
    ],
    np: {
      name: 'Golden Wild Hunt', title: 'Cacería Salvaje Dorada', card: 'Buster', kind: 'aoe', multiplier: 3.8, hits: 6,
      description: 'Daño a todos los enemigos. Antes: ATK propio +20% (3 turnos).', pre: [buff('self', 'atkUp', 0.2, 3)],
    },
  },
  // ───────── Caster ─────────
  {
    id: 'medea', name: 'Medea', cls: 'Caster', rarity: 3, attribute: 'Earth',
    hp: [1600, 9200], atk: [1350, 8000], deck: ['Quick', 'Arts', 'Arts', 'Arts', 'Buster'],
    npRate: 1.64, starRate: 0.11,
    lore: 'La Bruja de la Traición, princesa de la Cólquide.',
    skills: [
      skill('divine_words', 'Palabras Divinas Veloces A', 7, 'NP propio +40.', [np('self', 40)]),
      skill('argon', 'Moneda de Argón', 5, 'Cura un 25% de su vida.', [heal('self', 0.25)]),
      skill('golden_fleece', 'Vellocino de Oro', 7, 'Arts propio +40% (3 turnos).', [buff('self', 'artsUp', 0.4, 3)]),
    ],
    np: {
      name: 'Rule Breaker', title: 'Daga del Contrato Roto', card: 'Arts', kind: 'single', multiplier: 6.0, hits: 1,
      description: 'Daño a un enemigo y reduce su carga en 1.', post: [chargeDown('enemy', 1)],
    },
  },
  {
    id: 'merlin', name: 'Merlin', cls: 'Caster', rarity: 5, attribute: 'Man',
    hp: [2100, 14200], atk: [1350, 8400], deck: ['Quick', 'Arts', 'Arts', 'Arts', 'Buster'],
    npRate: 0.4, starRate: 0.11,
    lore: 'El Mago de las Flores, el que observa desde Avalon.',
    skills: [
      skill('dream_charisma', 'Carisma Onírico A', 7, 'ATK del equipo +20% (3 turnos) y NP del equipo +20.', [buff('allies', 'atkUp', 0.2, 3), np('allies', 20)]),
      skill('illusion', 'Ilusión A', 8, 'Aliado: Invencible (1 turno). Enemigos: carga -1.', [buff('ally', 'invincible', 1, 1, 1), chargeDown('enemies', 1)]),
      skill('hero_creation', 'Creación de Héroes EX', 7, 'Aliado: Buster +50% y Crítico +50% (3 turnos).', [buff('ally', 'busterUp', 0.5, 3), buff('ally', 'critUp', 0.5, 3)]),
    ],
    np: {
      name: 'Garden of Avalon', title: 'Jardín de los Eternos', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
      description: 'Equipo: regenera 10% de vida y 5 NP por turno (5 turnos).',
      post: [buff('allies', 'regen', 0.1, 5), buff('allies', 'npRegen', 5, 5)],
    },
  },
  {
    id: 'waver', name: 'Zhuge Liang (Lord El-Melloi II)', cls: 'Caster', rarity: 5, attribute: 'Man',
    hp: [2000, 14300], atk: [1350, 8700], deck: ['Quick', 'Arts', 'Arts', 'Arts', 'Buster'],
    npRate: 0.64, starRate: 0.11,
    lore: 'Un profesor de Clock Tower que tomó prestado el poder del gran estratega.',
    skills: [
      skill('discerning', 'Ojo Perspicaz B', 7, 'Aliado: NP +30 y Crítico +40% (3 turnos).', [np('ally', 30), buff('ally', 'critUp', 0.4, 3)]),
      skill('tactician_advice', 'Consejo del Estratega A+', 7, 'Equipo: DEF +20% (3 turnos), NP +10.', [buff('allies', 'defUp', 0.2, 3), np('allies', 10)]),
      skill('tactician_command', 'Mando del Estratega A+', 7, 'Equipo: ATK +20% (3 turnos).', [buff('allies', 'atkUp', 0.2, 3)]),
    ],
    np: {
      name: 'Unreturning Formation', title: 'Formación Sin Retorno de Shi Bing', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
      description: 'Enemigos: DEF -20% (3 turnos), carga -1 y aturdimiento (1 turno).',
      post: [buff('enemies', 'defDown', 0.2, 3), chargeDown('enemies', 1), buff('enemies', 'stun', 1, 1)],
    },
  },
  // ───────── Assassin ─────────
  {
    id: 'jack', name: 'Jack the Ripper', cls: 'Assassin', rarity: 5, attribute: 'Earth',
    hp: [1800, 12200], atk: [1780, 11550], deck: ['Quick', 'Quick', 'Arts', 'Arts', 'Buster'],
    npRate: 1.07, starRate: 0.26,
    lore: 'La niebla de Londres. "Vamos a desmontarte, mamá".',
    skills: [
      skill('murder_misty', 'Asesinato en la Noche Brumosa A', 7, 'Crítico propio +60% (1 turno).', [buff('self', 'critUp', 0.6, 1)]),
      skill('info_erasure', 'Borrado de Información B', 7, 'Enemigo: DEF -20% (3 turnos) y carga -1.', [buff('enemy', 'defDown', 0.2, 3), chargeDown('enemy', 1)]),
      skill('surgery', 'Cirugía E', 6, 'Aliado: cura un 30%.', [heal('ally', 0.3)]),
    ],
    np: {
      name: 'Maria the Ripper', title: 'Operación: Destripadora', card: 'Arts', kind: 'single', multiplier: 6.0, hits: 4,
      description: 'Gran daño a un enemigo. Antes: Daño NP +20% (1 turno).', pre: [buff('self', 'npDmgUp', 0.2, 1)],
    },
  },
  {
    id: 'kojirou', name: 'Sasaki Kojirou', cls: 'Assassin', rarity: 1, attribute: 'Man',
    hp: [1250, 7000], atk: [1050, 6000], deck: ['Quick', 'Quick', 'Arts', 'Arts', 'Buster'],
    npRate: 1.05, starRate: 0.25,
    lore: 'El guardián de la puerta del templo Ryuudou.',
    skills: [
      skill('kojirou_eye', 'Ojo de la Mente (Falso) A', 7, 'Evasión (1 turno) y Crítico +30% (3 turnos).', [buff('self', 'evade', 1, 1, 1), buff('self', 'critUp', 0.3, 3)]),
      skill('vitrification', 'Vitrificación B', 6, 'Gana 15 estrellas.', [stars(15)]),
      skill('swallow', 'Corte del Golondrino', 6, 'Quick propio +40% (1 turno).', [buff('self', 'quickUp', 0.4, 1)]),
    ],
    np: {
      name: 'Tsubame Gaeshi', title: 'Golondrina Invertida', card: 'Quick', kind: 'single', multiplier: 14.0, hits: 3,
      description: 'Tres cortes simultáneos contra un enemigo.',
    },
  },
  // ───────── Berserker ─────────
  {
    id: 'heracles', name: 'Heracles', cls: 'Berserker', rarity: 4, attribute: 'Sky',
    hp: [1800, 10600], atk: [1650, 10650], deck: ['Quick', 'Arts', 'Buster', 'Buster', 'Buster'],
    npRate: 1.07, starRate: 0.05,
    lore: 'El mayor héroe de Grecia. Ha superado doce pruebas.',
    skills: [
      skill('valor', 'Valor A+', 7, 'ATK propio +30% (3 turnos).', [buff('self', 'atkUp', 0.3, 3)]),
      skill('minds_eye_h', 'Ojo de la Mente (Falso) B', 6, 'Evasión (1 turno).', [buff('self', 'evade', 1, 1, 1)]),
      skill('god_hand', 'Mano de Dios', 9, 'Guts: revive con 50% de vida (5 turnos, 1 vez).', [buff('self', 'guts', 0.5, 5, 1)]),
    ],
    np: {
      name: 'Nine Lives', title: 'Disparo de las Cien Cabezas', card: 'Buster', kind: 'single', multiplier: 6.0, hits: 9,
      description: 'Nueve golpes contra un enemigo.',
    },
  },
  {
    id: 'lancelot', name: 'Lancelot', cls: 'Berserker', rarity: 4, attribute: 'Earth',
    hp: [1700, 10900], atk: [1700, 10600], deck: ['Quick', 'Arts', 'Buster', 'Buster', 'Buster'],
    npRate: 0.5, starRate: 0.05,
    lore: 'El Caballero del Lago, consumido por la locura.',
    skills: [
      skill('eternal_arms', 'Maestría Eterna en Armas A+', 7, 'Crítico +40% (3 turnos).', [buff('self', 'critUp', 0.4, 3)]),
      skill('protection_fairy', 'Protección del Hada A', 7, 'DEF +30% (3 turnos).', [buff('self', 'defUp', 0.3, 3)]),
      skill('own_honor', 'Por el Honor de Otro A', 7, 'Evasión 3 veces (3 turnos).', [buff('self', 'evade', 1, 3, 3)]),
    ],
    np: {
      name: 'Knight of Owner', title: 'Caballero Sin Mancha', card: 'Buster', kind: 'single', multiplier: 6.5, hits: 10,
      description: 'Gran daño a un enemigo. Antes: Buster propio +20% (3 turnos).', pre: [buff('self', 'busterUp', 0.2, 3)],
    },
  },
  {
    id: 'spartacus', name: 'Spartacus', cls: 'Berserker', rarity: 1, attribute: 'Man',
    hp: [1900, 10000], atk: [1000, 5800], deck: ['Quick', 'Arts', 'Buster', 'Buster', 'Buster'],
    npRate: 1.01, starRate: 0.05,
    lore: '¡El dolor es la prueba de que vivo! ¡Opresor!',
    skills: [
      skill('honor_suffering', 'Honor del Sufrimiento B+', 6, 'Regenera 10% de vida por turno (5 turnos).', [buff('self', 'regen', 0.1, 5)]),
      skill('unyielding', 'Voluntad Inquebrantable A', 8, 'Guts: revive con 50% de vida (5 turnos, 1 vez).', [buff('self', 'guts', 0.5, 5, 1)]),
      skill('spart_rage', 'Furia del Gladiador', 7, 'ATK +30% y NP +20.', [buff('self', 'atkUp', 0.3, 3), np('self', 20)]),
    ],
    np: {
      name: 'Crying Warmonger', title: 'Guerrero Lamentoso', card: 'Buster', kind: 'aoe', multiplier: 3.0, hits: 1,
      description: 'Daño a todos los enemigos. Después cura un 30% propio.', post: [heal('self', 0.3)],
    },
  },
  // ───────── Ruler / Avenger ─────────
  {
    id: 'jeanne', name: 'Jeanne d\'Arc', cls: 'Ruler', rarity: 5, attribute: 'Star',
    hp: [2400, 16500], atk: [1480, 9600], deck: ['Quick', 'Arts', 'Arts', 'Buster', 'Buster'],
    npRate: 0.76, starRate: 0.1,
    lore: 'La Doncella de Orleans, santa de la bandera.',
    skills: [
      skill('revelation', 'Revelación A', 6, 'Gana 15 estrellas y NP propio +20.', [stars(15), np('self', 20)]),
      skill('discernment', 'Discernimiento de Nombre B', 6, 'Enemigos: DEF -15% (3 turnos).', [buff('enemies', 'defDown', 0.15, 3)]),
      skill('divine_judgment', 'Juicio Divino A', 8, 'Aturde a un enemigo (1 turno).', [buff('enemy', 'stun', 1, 1)]),
    ],
    np: {
      name: 'Luminosité Eternelle', title: 'Dios Está Aquí Conmigo', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
      description: 'Equipo: Invencible (1 turno), DEF +30% (3 turnos) y elimina debuffs.',
      post: [buff('allies', 'invincible', 1, 1), buff('allies', 'defUp', 0.3, 3), cleanse('allies')],
    },
  },
  {
    id: 'edmond', name: 'Edmond Dantès', cls: 'Avenger', rarity: 5, attribute: 'Earth',
    hp: [1700, 12600], atk: [1950, 12700], deck: ['Quick', 'Quick', 'Arts', 'Buster', 'Buster'],
    npRate: 0.75, starRate: 0.06,
    lore: 'El Conde de Montecristo. El Avenger que espera... y tiene esperanza.',
    skills: [
      skill('iron_resolve', 'Resolución de Hierro EX', 8, 'Guts (5 turnos, 1 vez) y elimina debuffs.', [buff('self', 'guts', 0.4, 5, 1), cleanse('self')]),
      goldenRule('A', 0.5),
      skill('chateau_wisdom', 'Sabiduría del Château d\'If', 7, 'Evasión (1 turno) y Crítico +50% (3 turnos).', [buff('self', 'evade', 1, 1, 1), buff('self', 'critUp', 0.5, 3)]),
    ],
    np: {
      name: 'Enfer Château d\'If', title: 'Ha, Gran Castillo de Fuego', card: 'Quick', kind: 'aoe', multiplier: 5.0, hits: 8,
      description: 'Daño a todos los enemigos y DEF -20% (3 turnos).', pre: [buff('enemies', 'defDown', 0.2, 3)],
    },
  },
];

const BY_ID: Record<string, ServantDef> = Object.fromEntries(SERVANTS.map((s) => [s.id, s]));

export function getServant(id: string): ServantDef {
  const s = BY_ID[id];
  if (!s) throw new Error(`Servant desconocido: ${id}`);
  return s;
}

export const GACHA_POOL = SERVANTS.filter((s) => !s.noGacha);
