// Converts Atlas Academy "nice" servant data into FGOlike's ServantDef format.
// Pure functions (no I/O) so they can be tested with fixtures.

const CLASS_MAP = {
  saber: 'Saber', archer: 'Archer', lancer: 'Lancer', rider: 'Rider', caster: 'Caster',
  assassin: 'Assassin', berserker: 'Berserker', shielder: 'Shielder', ruler: 'Ruler',
  avenger: 'Avenger', alterEgo: 'AlterEgo', moonCancer: 'MoonCancer', foreigner: 'Foreigner',
  pretender: 'Pretender', beast: 'Beast',
};

export function mapClass(name) {
  if (!name) return null;
  if (CLASS_MAP[name]) return CLASS_MAP[name];
  if (/^(un)?beast/i.test(name)) return 'Beast';
  const grand = /^grand(.+)$/.exec(name);
  if (grand) return mapClass(grand[1][0].toLowerCase() + grand[1].slice(1));
  return null;
}

const ATTR = { human: 'Man', sky: 'Sky', earth: 'Earth', star: 'Star', beast: 'Beast' };
const CARD = { buster: 'Buster', arts: 'Arts', quick: 'Quick', 1: 'Arts', 2: 'Buster', 3: 'Quick' };
const TARGET = {
  self: 'self', commandTypeSelfTreasureDevice: 'self',
  ptOne: 'ally', ptAll: 'allies', ptFull: 'allies',
  ptOther: 'others', ptOtherFull: 'others',
  enemy: 'enemy', enemyAll: 'enemies', enemyFull: 'enemies',
};
const ALLY_TARGETS = new Set(['self', 'ally', 'allies', 'others']);
const CARD_INDIV = { cardBuster: 'busterUp', cardArts: 'artsUp', cardQuick: 'quickUp' };

/** Average Lv90 HP: converts flat HP values (heals, guts) into fractions. */
const HP_SCALE = 12000;

const SIMPLE_BUFFS = {
  upAtk: ['atkUp', (v) => v / 1000],
  downAtk: ['atkDown', (v) => v / 1000],
  upDefence: ['defUp', (v) => v / 1000],
  downDefence: ['defDown', (v) => v / 1000],
  upCriticaldamage: ['critUp', (v) => v / 1000],
  upCriticalrate: ['critRateUp', (v) => v / 1000],
  upNpdamage: ['npDmgUp', (v) => v / 1000],
  upDropnp: ['npGainUp', (v) => v / 1000],
  upCriticalpoint: ['starGenUp', (v) => v / 1000],
  upStarweight: ['starAbsorbUp', (v) => v / 1000],
  avoidance: ['evade', () => 1],
  invincible: ['invincible', () => 1],
  upHate: ['taunt', () => 1],
  guts: ['guts', (v) => Math.min(1, v / HP_SCALE)],
  gutsRatio: ['guts', (v) => v / 1000],
  regainHp: ['regen', (v) => v / HP_SCALE],
  regainNp: ['npRegen', (v) => v / 100],
  regainStar: ['starRegen', (v) => v],
  subSelfdamage: ['dmgCut', (v) => v],
  reduceHp: ['dot', (v) => v],
  donotAct: ['stun', () => 1],
};

const r3 = (v) => Math.round(v * 1000) / 1000;

/** Returns [{kind, value(sval)}] for a buff, or [] if unsupported. */
function mapBuff(buff) {
  if (buff.type === 'upCommandall' || buff.type === 'upCommandatk') {
    return (buff.ckSelfIndv ?? [])
      .map((i) => CARD_INDIV[i.name])
      .filter(Boolean)
      .map((kind) => ({ kind, conv: (v) => v / 1000 }));
  }
  const m = SIMPLE_BUFFS[buff.type];
  return m ? [{ kind: m[0], conv: m[1] }] : [];
}

/**
 * Maps one Atlas function to 0..n effects.
 * lo/hi = svals indexes for the min/max level (skills 0/9, NP 0/4).
 */
export function mapFunction(fn, lo, hi, stats) {
  if (fn.funcTargetTeam === 'enemy') return []; // only used when an enemy owns the skill
  const target = TARGET[fn.funcTargetType];
  const svals = fn.svals ?? [];
  const a = svals[lo] ?? svals[0] ?? {};
  const b = svals[hi] ?? svals[svals.length - 1] ?? a;
  const note = (k) => { if (stats) stats[k] = (stats[k] ?? 0) + 1; };
  if (!target) { note(`target:${fn.funcTargetType}`); return []; }

  const chance = a.Rate !== undefined && Math.abs(a.Rate) < 1000 ? Math.abs(a.Rate) / 1000 : undefined;
  const pair = (conv) => {
    const v1 = r3(conv(a.Value ?? 0));
    const v2 = r3(conv(b.Value ?? a.Value ?? 0));
    return v1 === v2 ? { v: v1 } : { v: v1, max: v2 };
  };

  switch (fn.funcType) {
    case 'addState':
    case 'addStateShort': {
      const out = [];
      for (const buff of fn.buffs ?? []) {
        const mapped = mapBuff(buff);
        if (!mapped.length) note(`buff:${buff.type}`);
        for (const m of mapped) {
          const { v, max } = pair(m.conv);
          const e = { type: 'buff', target, kind: m.kind, value: v, turns: a.Turn ?? -1 };
          if (max !== undefined) e.max = max;
          if (a.Count !== undefined && a.Count > 0) e.times = a.Count;
          if (chance !== undefined && !ALLY_TARGETS.has(target)) e.chance = chance;
          out.push(e);
        }
      }
      return out;
    }
    case 'gainNp': {
      const { v, max } = pair((x) => x / 100);
      return [{ type: 'np', target, amount: v, ...(max !== undefined && { max }) }];
    }
    case 'gainStar': {
      const { v, max } = pair((x) => x);
      return [{ type: 'stars', amount: v, ...(max !== undefined && { max }) }];
    }
    case 'gainHp': {
      const { v, max } = pair((x) => x / HP_SCALE);
      return [{ type: 'heal', target, amount: v, ...(max !== undefined && { max }) }];
    }
    case 'gainHpPer': {
      const { v, max } = pair((x) => x / 1000);
      return [{ type: 'heal', target, amount: v, ...(max !== undefined && { max }) }];
    }
    case 'subState':
      return [{ type: ALLY_TARGETS.has(target) ? 'cleanse' : 'dispel', target }];
    case 'delayNpturn': {
      const e = { type: 'chargeDown', target, amount: Math.max(1, a.Value ?? 1) };
      if (chance !== undefined) e.chance = chance;
      return [e];
    }
    default:
      note(`func:${fn.funcType}`);
      return [];
  }
}

const isDamage = (fn) => typeof fn.funcType === 'string' && fn.funcType.startsWith('damageNp');

function pickBest(list) {
  return [...list].sort((x, y) => (y.priority ?? 0) - (x.priority ?? 0) || (y.id ?? 0) - (x.id ?? 0))[0];
}

function convertNp(np, stats) {
  const fns = np.functions ?? [];
  const dmgIdx = fns.findIndex(isDamage);
  const map = (list) => list.flatMap((f) => mapFunction(f, 0, 4, stats));
  const out = {
    name: np.name,
    card: CARD[np.card] ?? 'Arts',
    kind: 'support',
    multiplier: 0,
    hits: Math.max(1, (np.npDistribution ?? []).length),
  };
  if (np.rank) out.title = `${np.type ?? ''} ${np.rank}`.trim();
  if (dmgIdx >= 0) {
    const d = fns[dmgIdx];
    const s = d.svals ?? [];
    out.kind = d.funcTargetType === 'enemyAll' || d.funcTargetType === 'enemyFull' ? 'aoe' : 'single';
    out.multiplier = r3((s[0]?.Value ?? 0) / 1000);
    const m5 = r3((s[4]?.Value ?? s[0]?.Value ?? 0) / 1000);
    if (m5 !== out.multiplier) out.multiplierMax = m5;
    const pre = map(fns.slice(0, dmgIdx));
    const post = map(fns.slice(dmgIdx + 1));
    if (pre.length) out.pre = pre;
    if (post.length) out.post = post;
  } else {
    const post = map(fns);
    if (post.length) out.post = post;
  }
  return out;
}

const TRAIT_SKIP = new Set([
  'unknown', 'canBeInBattle', 'servant', 'hasCostume', 'humanoid', 'skyOrEarthServant',
  'skyOrEarthExceptPseudoAndDemiServant', 'hominidaeServant',
]);

export const PLAYABLE_TYPES = new Set(['normal', 'heroine']);

export function convertServant(s, stats = {}) {
  const cls = mapClass(s.className);
  if (!cls) { stats[`class:${s.className}`] = (stats[`class:${s.className}`] ?? 0) + 1; return null; }
  if (!PLAYABLE_TYPES.has(s.type) || !s.collectionNo) return null;

  const growth = (arr, base, max) => (Array.isArray(arr) && arr.length >= 90 ? [arr[0], arr[89]] : [base, max]);

  const skills = [1, 2, 3]
    .map((num) => pickBest((s.skills ?? []).filter((k) => k.num === num)))
    .filter(Boolean)
    .map((k) => {
      const cd = k.coolDown ?? [7];
      const out = {
        id: String(k.id),
        name: k.name,
        cooldown: cd[0],
        effects: (k.functions ?? []).flatMap((f) => mapFunction(f, 0, 9, stats)),
      };
      if (cd[9] !== undefined && cd[9] !== cd[0]) out.cooldownMax = cd[9];
      return out;
    });

  const passives = (s.classPassive ?? [])
    .map((p) => ({ name: p.name, effects: (p.functions ?? []).flatMap((f) => mapFunction(f, 0, 0, stats)) }))
    .filter((p) => p.effects.length);

  const npSrc = pickBest(s.noblePhantasms ?? []);
  if (!npSrc) return null;
  const np = convertNp(npSrc, stats);
  const hitsOf = (k, d) => (s.hitsDistribution?.[k]?.length ?? d);

  const def = {
    id: s.collectionNo === 1 ? 'mash' : `c${s.collectionNo}`,
    collectionNo: s.collectionNo,
    name: s.name,
    cls,
    rarity: Math.max(0, Math.min(5, s.rarity ?? 3)),
    attribute: ATTR[s.attribute] ?? 'Earth',
    hp: growth(s.hpGrowth, s.hpBase, s.hpMax),
    atk: growth(s.atkGrowth, s.atkBase, s.atkMax),
    deck: (s.cards ?? []).slice(0, 5).map((c) => CARD[c] ?? 'Arts'),
    npRate: (npSrc.npGain?.arts?.[0] ?? 50) / 100,
    npDef: (npSrc.npGain?.defence?.[0] ?? 300) / 100,
    starRate: (s.starGen ?? 100) / 1000,
    starAbsorb: s.starAbsorb ?? 100,
    hits: { Buster: hitsOf('buster', 1), Arts: hitsOf('arts', 2), Quick: hitsOf('quick', 3), Extra: hitsOf('extra', 4) },
    skills,
    np,
    traits: (s.traits ?? []).map((t) => t.name).filter((t) => t && !TRAIT_SKIP.has(t)),
  };
  if (passives.length) def.passives = passives;
  if (s.collectionNo === 1) def.noGacha = true;
  while (def.deck.length < 5) def.deck.push('Arts');
  return def;
}

/** Disambiguates duplicate names ("Altria Pendragon" → "Altria Pendragon (Lancer)"). */
export function disambiguate(defs) {
  const count = {};
  for (const d of defs) count[d.name] = (count[d.name] ?? 0) + 1;
  const seen = {};
  for (const d of defs) {
    if (count[d.name] > 1) {
      const n = `${d.name} (${d.cls === 'AlterEgo' ? 'Alter Ego' : d.cls === 'MoonCancer' ? 'Moon Cancer' : d.cls})`;
      seen[n] = (seen[n] ?? 0) + 1;
      d.name = seen[n] > 1 ? `${n} ${seen[n]}` : n;
    }
  }
  return defs;
}

/** NiceClassRelation.json → { Saber: { Lancer: 2, ... } } (only non-neutral values). */
export function convertClassRelation(raw) {
  const out = {};
  for (const [atk, row] of Object.entries(raw ?? {})) {
    const a = mapClass(atk);
    if (!a || (out[a] && atk !== 'beast')) continue;
    out[a] = {};
    for (const [def, rate] of Object.entries(row)) {
      const d = mapClass(def);
      if (!d || rate === 1000 || out[a][d] !== undefined) continue;
      out[a][d] = rate / 1000;
    }
  }
  return out;
}
