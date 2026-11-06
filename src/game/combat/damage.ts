import {
  CARD_BUFF, CARD_DAMAGE, CARD_NP, CARD_STAR, CLASS_ATK_MOD,
  attributeAffinity, classAffinity,
} from '../constants';
import type { BuffKind, CardType, Unit } from '../types';

export function buffSum(u: Unit, kind: BuffKind): number {
  return u.buffs.reduce((s, b) => (b.kind === kind ? s + b.value : s), 0);
}

export function hasBuff(u: Unit, kind: BuffKind): boolean {
  return u.buffs.some((b) => b.kind === kind);
}

export interface AttackContext {
  card: CardType;
  /** Modificador por posición (1, 1.2, 1.4). Para NP y Extra = 1 */
  posMod: number;
  /** Bonus de primera carta Buster (0.5) */
  busterFirst: boolean;
  /** Para NP: multiplicador del Noble Phantasm (ya con nivel/OC). */
  npMult?: number;
  /** Para Extra Attack: 2 ó 3.5 */
  extraMult?: number;
  crit: boolean;
  /** Bonus plano por Buster Chain (20% del ATK). */
  busterChain: boolean;
  /** Varianza aleatoria 0.9–1.1 */
  random: number;
}

/**
 * Fórmula de daño simplificada de FGO:
 *   ATK · 0.23 · (bonus1ª + valorCarta · pos · (1+buffCarta)) · clase · afinidad · atributo · rand
 *       · (1 + atkUp − defUp) · crit · (1 + npDmgUp) + buster chain
 */
export function computeDamage(att: Unit, def: Unit, ctx: AttackContext): number {
  const cardUp = buffSum(att, CARD_BUFF[ctx.card]);
  let cardTerm: number;
  if (ctx.npMult !== undefined) {
    cardTerm = ctx.npMult * CARD_DAMAGE[ctx.card] * (1 + cardUp);
  } else if (ctx.extraMult !== undefined) {
    cardTerm = (ctx.busterFirst ? 0.5 : 0) + ctx.extraMult;
  } else {
    cardTerm = (ctx.busterFirst ? 0.5 : 0) + CARD_DAMAGE[ctx.card] * ctx.posMod * (1 + cardUp);
  }

  const atkMod = buffSum(att, 'atkUp') - buffSum(att, 'atkDown');
  const defMod = buffSum(def, 'defUp') - buffSum(def, 'defDown');
  const powerMod = Math.max(0.1, 1 + atkMod - defMod);
  const critMod = ctx.crit && ctx.npMult === undefined ? 2 * (1 + buffSum(att, 'critUp')) : 1;
  const npMod = ctx.npMult !== undefined ? 1 + buffSum(att, 'npDmgUp') : 1;

  const dmg =
    att.atk * 0.23 * cardTerm *
    CLASS_ATK_MOD[att.cls] *
    classAffinity(att.cls, def.cls) *
    attributeAffinity(att.attribute, def.attribute) *
    ctx.random * powerMod * critMod * npMod +
    (ctx.busterChain && ctx.card === 'Buster' && ctx.npMult === undefined ? att.atk * 0.2 : 0);

  return Math.max(1, Math.round(dmg));
}

/** NP ganado por un ataque (en %). */
export function computeNpGain(
  att: Unit & { npRate: number }, card: CardType, hits: number,
  opts: { posMod: number; artsFirst: boolean; crit: boolean; isNp: boolean; isExtra: boolean },
): number {
  const cardUp = buffSum(att, CARD_BUFF[card]);
  const cardNp = opts.isExtra ? 1 : CARD_NP[card];
  const term = opts.isNp
    ? cardNp * (1 + cardUp)
    : (opts.artsFirst ? 1 : 0) + cardNp * opts.posMod * (1 + cardUp);
  const gain = att.npRate * hits * term * (opts.crit ? 2 : 1) * (1 + buffSum(att, 'npGainUp'));
  return Math.round(gain * 10) / 10;
}

/** Estrellas esperadas generadas por un ataque. */
export function computeStarGen(
  att: Unit & { starRate: number }, card: CardType, hits: number,
  opts: { posMod: number; quickFirst: boolean; crit: boolean; isNp: boolean; isExtra: boolean },
): number {
  const cardUp = buffSum(att, CARD_BUFF[card]);
  const cardStar = opts.isExtra ? 1 : CARD_STAR[card];
  const perHit =
    att.starRate +
    (opts.isNp ? cardStar * (1 + cardUp) : (opts.quickFirst ? 0.2 : 0) + cardStar * opts.posMod * (1 + cardUp)) +
    (opts.crit ? 0.2 : 0) +
    buffSum(att, 'starGenUp');
  return Math.max(0, perHit) * hits;
}
