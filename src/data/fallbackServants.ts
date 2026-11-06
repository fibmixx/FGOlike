// Hand-made fallback roster, used only until `npm run import:atlas`
// generates src/data/generated/servants.json from Atlas Academy (JP).
import type { BuffKind, CardType, Effect, NoblePhantasmDef, ServantDef, SkillDef, TargetSpec } from '@/game/types';

const buff = (target: TargetSpec, kind: BuffKind, value: number, turns: number, times?: number, max?: number): Effect =>
  ({ type: 'buff', target, kind, value, turns, ...(times !== undefined && { times }), ...(max !== undefined && { max }) });
const heal = (target: TargetSpec, amount: number): Effect => ({ type: 'heal', target, amount });
const np = (target: TargetSpec, amount: number, max?: number): Effect => ({ type: 'np', target, amount, ...(max !== undefined && { max }) });
const stars = (amount: number): Effect => ({ type: 'stars', amount });
const chargeDown = (target: TargetSpec, amount = 1): Effect => ({ type: 'chargeDown', target, amount });
const cleanse = (target: TargetSpec): Effect => ({ type: 'cleanse', target });
const sk = (id: string, name: string, cooldown: number, effects: Effect[]): SkillDef => ({ id, name, cooldown, cooldownMax: cooldown - 2, effects });

const Q: CardType = 'Quick', A: CardType = 'Arts', B: CardType = 'Buster';
const QAABB: ServantDef['deck'] = [Q, A, A, B, B];
const QQABB: ServantDef['deck'] = [Q, Q, A, B, B];
const QQAAB: ServantDef['deck'] = [Q, Q, A, A, B];
const QAAAB: ServantDef['deck'] = [Q, A, A, A, B];
const QABBB: ServantDef['deck'] = [Q, A, B, B, B];

function sv(
  id: string, name: string, cls: ServantDef['cls'], rarity: ServantDef['rarity'], attribute: ServantDef['attribute'],
  hp: [number, number], atk: [number, number], deck: ServantDef['deck'], npRate: number, starRate: number,
  skills: SkillDef[], npDef: NoblePhantasmDef, extra: Partial<ServantDef> = {},
): ServantDef {
  return { id, name, cls, rarity, attribute, hp, atk, deck, npRate, starRate, skills, np: npDef, ...extra };
}

export const FALLBACK_SERVANTS: ServantDef[] = [
  sv('mash', 'Mash Kyrielight', 'Shielder', 3, 'Earth', [2100, 12000], [1300, 7800], QAABB, 0.84, 0.1, [
    sk('wall_snow', 'Transient Wall of Snowflakes', 7, [buff('allies', 'defUp', 0.15, 3, undefined, 0.3)]),
    sk('wall_chalk', 'Obscurant Wall of Chalk', 7, [buff('ally', 'invincible', 1, 1, 1), np('ally', 10, 20)]),
    sk('rousing', 'Shield of Rousing Resolution', 7, [buff('self', 'taunt', 1, 3), buff('self', 'npGainUp', 0.3, 3, undefined, 0.5)]),
  ], { name: 'Lord Chaldeas', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
    post: [buff('allies', 'defUp', 0.3, 3), buff('allies', 'dmgCut', 300, 3, undefined, 1000)] }, { noGacha: true }),

  sv('artoria', 'Altria Pendragon', 'Saber', 5, 'Earth', [2200, 15150], [1730, 11220], QAABB, 0.86, 0.1, [
    sk('utopia', 'Knight of Utopia', 7, [buff('allies', 'atkUp', 0.1, 3, undefined, 0.2), np('allies', 10, 20)]),
    sk('mana_burst', 'Mana Burst A', 7, [buff('self', 'busterUp', 0.3, 1, undefined, 0.5), np('self', 20, 30)]),
    sk('instinct', 'Instinct A', 7, [stars(10), buff('self', 'critUp', 0.2, 3, undefined, 0.4)]),
  ], { name: 'Excalibur', card: 'Buster', kind: 'aoe', multiplier: 4, multiplierMax: 6, hits: 1, post: [np('self', 20)] }),

  sv('siegfried', 'Siegfried', 'Saber', 4, 'Earth', [2000, 12300], [1500, 9120], QAABB, 0.83, 0.1, [
    sk('golden_rule', 'Golden Rule C-', 7, [buff('self', 'npGainUp', 0.2, 3, undefined, 0.4)]),
    sk('disengage', 'Disengage A', 6, [heal('self', 0.25), cleanse('self')]),
    sk('fafnir', 'Armor of Fafnir', 7, [buff('self', 'defUp', 0.3, 3), buff('self', 'taunt', 1, 3)]),
  ], { name: 'Balmung', card: 'Buster', kind: 'aoe', multiplier: 3.5, multiplierMax: 5.5, hits: 1 }),

  sv('nero', 'Nero Claudius', 'Saber', 4, 'Man', [1900, 11900], [1550, 9405], QAABB, 0.84, 0.1, [
    sk('imperial', 'Imperial Privilege EX', 6, [heal('self', 0.3), buff('self', 'atkUp', 0.2, 3)]),
    sk('invictus', 'Invictus Spiritus A', 8, [buff('self', 'guts', 0.3, 5, 1)]),
    sk('nero_charisma', 'Charisma C', 7, [buff('allies', 'atkUp', 0.15, 3), np('self', 20)]),
  ], { name: 'Aestus Domus Aurea', card: 'Buster', kind: 'single', multiplier: 6, multiplierMax: 10, hits: 3, pre: [buff('enemy', 'defDown', 0.2, 3)] }),

  sv('emiya', 'EMIYA', 'Archer', 4, 'Man', [1950, 11400], [1600, 9500], QAAAB, 0.88, 0.08, [
    sk('minds_eye', "Mind's Eye (True) B", 7, [buff('self', 'evade', 1, 1, 1), buff('self', 'defUp', 0.18, 3)]),
    sk('clairvoyance', 'Clairvoyance C', 6, [buff('self', 'starGenUp', 0.3, 3)]),
    sk('projection', 'Projection A', 6, [buff('self', 'artsUp', 0.3, 1, undefined, 0.5)]),
  ], { name: 'Unlimited Blade Works', card: 'Arts', kind: 'aoe', multiplier: 4.5, multiplierMax: 7.5, hits: 10, pre: [buff('self', 'atkUp', 0.2, 3)] }),

  sv('gilgamesh', 'Gilgamesh', 'Archer', 5, 'Sky', [1900, 13100], [1890, 12280], QAABB, 0.34, 0.08, [
    sk('charisma', 'Charisma A+', 7, [buff('allies', 'atkUp', 0.105, 3, undefined, 0.21)]),
    sk('golden_rule', 'Golden Rule A', 7, [buff('self', 'npGainUp', 0.3, 3, undefined, 0.5)]),
    sk('collector', 'Collector EX', 6, [stars(20)]),
  ], { name: 'Enuma Elish', card: 'Buster', kind: 'aoe', multiplier: 4, multiplierMax: 6, hits: 1, pre: [buff('self', 'npDmgUp', 0.3, 1)] }),

  sv('robin', 'Robin Hood', 'Archer', 3, 'Earth', [1700, 10200], [1200, 7600], QQAAB, 0.87, 0.08, [
    sk('sabotage', 'Sabotage A', 6, [buff('enemies', 'atkDown', 0.15, 3)]),
    sk('golden_rule', 'Golden Rule E', 7, [buff('self', 'npGainUp', 0.18, 3)]),
    sk('may_king', 'May King B', 7, [buff('self', 'evade', 1, 1, 1), buff('self', 'starGenUp', 0.3, 3)]),
  ], { name: 'Yew Bow', card: 'Arts', kind: 'single', multiplier: 9, multiplierMax: 13.5, hits: 1, post: [buff('enemy', 'dot', 500, 5)] }),

  sv('cu', 'Cú Chulainn', 'Lancer', 3, 'Sky', [1700, 10600], [1300, 7500], QQABB, 1.07, 0.12, [
    sk('battle_cont', 'Battle Continuation A', 8, [buff('self', 'guts', 0.3, 5, 1)]),
    sk('arrows', 'Protection from Arrows B', 7, [buff('self', 'evade', 1, 3, 3)]),
    sk('disengage', 'Disengage C', 6, [heal('self', 0.2), cleanse('self')]),
  ], { name: 'Gáe Bolg', card: 'Buster', kind: 'single', multiplier: 6, multiplierMax: 10, hits: 1, post: [buff('enemy', 'defDown', 0.2, 3)] }),

  sv('scathach', 'Scáthach', 'Lancer', 5, 'Star', [2200, 14800], [1750, 11320], QQABB, 0.71, 0.12, [
    sk('dun_scaith', 'Wisdom of Dun Scáith A+', 7, [buff('self', 'starGenUp', 0.4, 3), buff('self', 'evade', 1, 1, 1)]),
    sk('rune', 'Primordial Rune', 6, [buff('self', 'quickUp', 0.3, 1, undefined, 0.5)]),
    sk('godslayer', 'God-Slayer B', 7, [buff('self', 'critUp', 0.3, 3, undefined, 0.5)]),
  ], { name: 'Gáe Bolg Alternative', card: 'Quick', kind: 'single', multiplier: 12, multiplierMax: 20, hits: 2 }),

  sv('leonidas', 'Leonidas I', 'Lancer', 2, 'Man', [1650, 9300], [1100, 6300], QAABB, 0.86, 0.12, [
    sk('battle_cry', 'Battle Cry B', 7, [buff('allies', 'busterUp', 0.2, 3)]),
    sk('rearguard', 'Rearguard Stand A', 7, [buff('self', 'taunt', 1, 3), buff('self', 'defUp', 0.3, 3)]),
    sk('leo_cont', 'Battle Continuation A', 8, [buff('self', 'guts', 0.3, 5, 1)]),
  ], { name: 'Thermopylae Enomotia', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
    post: [buff('self', 'taunt', 1, 1), buff('self', 'defUp', 0.5, 3), np('allies', 10)] }),

  sv('medusa', 'Medusa', 'Rider', 3, 'Earth', [1600, 9500], [1300, 7900], QQAAB, 0.58, 0.09, [
    sk('mystic_eyes', 'Mystic Eyes A+', 8, [buff('enemy', 'stun', 1, 1)]),
    sk('monstrous', 'Monstrous Strength B', 7, [buff('self', 'atkUp', 0.3, 2)]),
    sk('blood_fort', 'Blood Fort Andromeda', 7, [stars(15), np('self', 20)]),
  ], { name: 'Bellerophon', card: 'Quick', kind: 'aoe', multiplier: 6, multiplierMax: 9, hits: 5, post: [stars(15)] }),

  sv('iskandar', 'Iskandar', 'Rider', 5, 'Man', [2000, 13400], [1650, 10900], QQABB, 0.59, 0.09, [
    sk('charisma', 'Charisma A', 7, [buff('allies', 'atkUp', 0.1, 3, undefined, 0.2)]),
    sk('tactics', 'Military Tactics B', 7, [buff('allies', 'npDmgUp', 0.1, 1, undefined, 0.2)]),
    sk('rule', 'Golden Rule A', 7, [buff('self', 'npGainUp', 0.3, 3, undefined, 0.5), np('self', 20)]),
  ], { name: 'Ionioi Hetairoi', card: 'Buster', kind: 'aoe', multiplier: 3, multiplierMax: 5, hits: 10 }),

  sv('medea', 'Medea', 'Caster', 3, 'Earth', [1600, 9200], [1350, 8000], QAAAB, 1.64, 0.11, [
    sk('divine_words', 'High-Speed Divine Words A', 7, [np('self', 30, 50)]),
    sk('argon', 'Argon Coin', 5, [heal('self', 0.25)]),
    sk('fleece', 'Golden Fleece', 7, [buff('self', 'artsUp', 0.3, 3)]),
  ], { name: 'Rule Breaker', card: 'Arts', kind: 'single', multiplier: 9, multiplierMax: 13.5, hits: 1, post: [chargeDown('enemy', 1)] }),

  sv('merlin', 'Merlin', 'Caster', 5, 'Man', [2100, 14200], [1350, 8400], QAAAB, 0.4, 0.11, [
    sk('dream_charisma', 'Dreamlike Charisma A', 7, [buff('allies', 'atkUp', 0.1, 3, undefined, 0.2), np('allies', 10, 20)]),
    sk('illusion', 'Illusion A', 8, [buff('ally', 'invincible', 1, 1, 1), chargeDown('enemies', 1)]),
    sk('hero_creation', 'Hero Creation EX', 7, [buff('ally', 'busterUp', 0.3, 3, undefined, 0.5), buff('ally', 'critUp', 0.3, 3, undefined, 0.5)]),
  ], { name: 'Garden of Avalon', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
    post: [buff('allies', 'regen', 0.08, 5), buff('allies', 'npRegen', 5, 5)] }),

  sv('waver', 'Zhuge Liang (Lord El-Melloi II)', 'Caster', 5, 'Man', [2000, 14300], [1350, 8700], QAAAB, 0.64, 0.11, [
    sk('discerning', 'Discerning Eye B', 7, [np('ally', 20, 30), buff('ally', 'critUp', 0.2, 3, undefined, 0.4)]),
    sk('advice', "Tactician's Advice A+", 7, [buff('allies', 'defUp', 0.2, 3), np('allies', 10)]),
    sk('command', "Tactician's Command A+", 7, [buff('allies', 'atkUp', 0.2, 3, undefined, 0.3)]),
  ], { name: 'Unreturning Formation', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
    post: [buff('enemies', 'defDown', 0.2, 3), chargeDown('enemies', 1), buff('enemies', 'stun', 1, 1)] }),

  sv('jack', 'Jack the Ripper', 'Assassin', 5, 'Earth', [1800, 12200], [1780, 11550], QQAAB, 1.07, 0.26, [
    sk('misty', 'Murder on a Misty Night A', 7, [buff('self', 'critUp', 0.5, 1, undefined, 1)]),
    sk('erasure', 'Information Erasure B', 7, [buff('enemy', 'defDown', 0.2, 3), chargeDown('enemy', 1)]),
    sk('surgery', 'Surgery E', 6, [heal('ally', 0.3)]),
  ], { name: 'Maria the Ripper', card: 'Arts', kind: 'single', multiplier: 9, multiplierMax: 13.5, hits: 4 }),

  sv('kojirou', 'Sasaki Kojirou', 'Assassin', 1, 'Man', [1250, 7000], [1050, 6000], QQAAB, 1.05, 0.25, [
    sk('eye', "Mind's Eye (Fake) A", 7, [buff('self', 'evade', 1, 1, 1), buff('self', 'critUp', 0.3, 3)]),
    sk('vitrification', 'Vitrification B', 6, [stars(15)]),
    sk('swallow', 'Knowledge of the Swallow', 6, [buff('self', 'quickUp', 0.4, 1)]),
  ], { name: 'Tsubame Gaeshi', card: 'Quick', kind: 'single', multiplier: 16, multiplierMax: 24, hits: 3 }),

  sv('heracles', 'Heracles', 'Berserker', 4, 'Sky', [1800, 10600], [1650, 10650], QABBB, 1.07, 0.05, [
    sk('valor', 'Valor A+', 7, [buff('self', 'atkUp', 0.2, 3, undefined, 0.4)]),
    sk('eye', "Mind's Eye (Fake) B", 6, [buff('self', 'evade', 1, 1, 1)]),
    sk('god_hand', 'God Hand', 9, [buff('self', 'guts', 0.5, 5, 1)]),
  ], { name: 'Nine Lives', card: 'Buster', kind: 'single', multiplier: 6, multiplierMax: 10, hits: 9 }),

  sv('lancelot', 'Lancelot', 'Berserker', 4, 'Earth', [1700, 10900], [1700, 10600], QABBB, 0.5, 0.05, [
    sk('arms', 'Eternal Arms Mastery A+', 7, [buff('self', 'critUp', 0.4, 3)]),
    sk('fairy', 'Protection of the Fairy A', 7, [buff('self', 'defUp', 0.3, 3)]),
    sk('glory', "For Someone's Glory A", 7, [buff('self', 'evade', 1, 3, 3)]),
  ], { name: 'Knight of Owner', card: 'Buster', kind: 'single', multiplier: 6, multiplierMax: 10, hits: 10, pre: [buff('self', 'busterUp', 0.2, 3)] }),

  sv('spartacus', 'Spartacus', 'Berserker', 1, 'Man', [1900, 10000], [1000, 5800], QABBB, 1.01, 0.05, [
    sk('suffering', 'Honor of Suffering B+', 6, [buff('self', 'regen', 0.1, 5)]),
    sk('unyielding', 'Unyielding A', 8, [buff('self', 'guts', 0.5, 5, 1)]),
    sk('fury', "Gladiator's Fury", 7, [buff('self', 'atkUp', 0.3, 3), np('self', 20)]),
  ], { name: 'Crying Warmonger', card: 'Buster', kind: 'aoe', multiplier: 3, multiplierMax: 5, hits: 1, post: [heal('self', 0.3)] }),

  sv('jeanne', "Jeanne d'Arc", 'Ruler', 5, 'Star', [2400, 16500], [1480, 9600], QAABB, 0.76, 0.1, [
    sk('revelation', 'Revelation A', 6, [stars(15), np('self', 20)]),
    sk('discernment', 'True Name Discernment B', 6, [buff('enemies', 'defDown', 0.15, 3)]),
    sk('judgment', 'Divine Judgment A', 8, [buff('enemy', 'stun', 1, 1)]),
  ], { name: 'Luminosité Eternelle', card: 'Arts', kind: 'support', multiplier: 0, hits: 0,
    post: [buff('allies', 'invincible', 1, 1), buff('allies', 'defUp', 0.3, 3), cleanse('allies')] }),

  sv('edmond', 'Edmond Dantès', 'Avenger', 5, 'Earth', [1700, 12600], [1950, 12700], QQABB, 0.62, 0.06, [
    sk('iron', 'Iron Determination EX', 8, [buff('self', 'atkUp', 0.3, 1, undefined, 0.5)]),
    sk('golden_rule', 'Golden Rule A', 8, [buff('self', 'npGainUp', 0.2, 3, undefined, 0.5)]),
    sk('crisis', 'Wisdom of Crisis A', 8, [cleanse('self'), stars(10)]),
  ], { name: "Enfer Château d'If", card: 'Quick', kind: 'aoe', multiplier: 8, multiplierMax: 12, hits: 8,
    post: [buff('enemies', 'defDown', 0.2, 3), buff('enemies', 'dot', 500, 5)] }),
];
