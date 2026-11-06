import { describe, expect, it } from 'vitest';
import { SERVANTS } from '@/data/servants';
import { CRAFT_ESSENCES } from '@/data/craftEssences';
import { classAffinity } from '@/game/constants';
import {
  aliveEnemies, beginTurn, createBattle, describeChain, executeTurn, stepTurn, toggleSelect,
} from '@/game/combat/battle';
import { computeDamage } from '@/game/combat/damage';
import { makeAlly, makeEnemy } from '@/game/combat/factory';
import { resolveNp, resolveSkill } from '@/game/effects';
import { generateMap, MAP_ROWS } from '@/game/map/generator';
import { ascend, canAscend, gainExp } from '@/game/progression/leveling';
import { Rng } from '@/game/rng';
import { chooseStarter, enterNode, newRun, recruit } from '@/game/run';
import type { ServantInstance } from '@/game/types';

const id0 = SERVANTS.find((s) => !s.noGacha)!.id;
const inst = (defId: string, level = 10): ServantInstance =>
  ({ uid: `u_${defId}`, defId, level, exp: 0, ascension: 0, npLevel: 1, hp: 99999, np: 0, ce: null });

describe('data', () => {
  it('every servant has a 5-card deck and an NP', () => {
    for (const s of SERVANTS) {
      expect(s.deck).toHaveLength(5);
      expect(!!s.np).toBe(true);
    }
  });
  it('craft essences have unique ids', () => {
    expect(new Set(CRAFT_ESSENCES.map((c) => c.id)).size).toBe(CRAFT_ESSENCES.length);
  });
});

describe('class affinity', () => {
  it('knight and cavalry triangles', () => {
    expect(classAffinity('Saber', 'Lancer')).toBe(2);
    expect(classAffinity('Archer', 'Saber')).toBe(2);
    expect(classAffinity('Lancer', 'Saber')).toBe(0.5);
    expect(classAffinity('Rider', 'Caster')).toBe(2);
    expect(classAffinity('Shielder', 'Berserker')).toBe(1);
  });
});

describe('scaling', () => {
  it('skills scale from level 1 to 10 and NPs from NP1 to NP5', () => {
    const skill = { id: 'x', name: 'X', cooldown: 7, cooldownMax: 5, effects: [{ type: 'np' as const, target: 'self' as const, amount: 20, max: 30 }] };
    expect(resolveSkill(skill, 1).cooldown).toBe(7);
    expect(resolveSkill(skill, 10).cooldown).toBe(5);
    const e10 = resolveSkill(skill, 10).effects[0];
    expect(e10.type === 'np' && e10.amount).toBe(30);
    const np = { name: 'N', card: 'Arts' as const, kind: 'aoe' as const, multiplier: 4.5, multiplierMax: 7.5, hits: 3 };
    expect(resolveNp(np, 5).multiplier).toBe(7.5);
  });
});

describe('damage', () => {
  it('Buster > Arts > Quick and crits double', () => {
    const a = makeAlly(inst(id0));
    const e = makeEnemy('skeleton', 10);
    const base = { posMod: 1, busterFirst: false, crit: false, busterChain: false, random: 1 };
    const b = computeDamage(a, e, { ...base, card: 'Buster' });
    const ar = computeDamage(a, e, { ...base, card: 'Arts' });
    const q = computeDamage(a, e, { ...base, card: 'Quick' });
    expect(b).toBeGreaterThan(ar);
    expect(ar).toBeGreaterThan(q);
    expect(computeDamage(a, e, { ...base, card: 'Buster', crit: true }) / b).toBeGreaterThan(1.9);
  });
});

describe('battle', () => {
  it('a 3-card chain resolves step by step', () => {
    const rng = new Rng(42);
    const s = createBattle(rng, [inst(id0, 30), inst('mash', 30)], [[makeEnemy('skeleton', 1), makeEnemy('skeleton', 1)]], 'battle');
    expect(s.hand).toHaveLength(5);
    s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
    expect(beginTurn(s)).toBe(true);
    expect(s.phase).toBe('resolving');
    let steps = 0;
    while (s.phase === 'resolving' && steps++ < 50) stepTurn(s, rng);
    expect(steps).toBeGreaterThan(3);
    expect(s.turn === 2 || s.status === 'won').toBe(true);
  });

  it('brave chain is detected', () => {
    const rng = new Rng(1);
    const s = createBattle(rng, [inst(id0)], [[makeEnemy('skeleton', 1)]], 'battle');
    s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
    expect(describeChain(s).brave).toBe(true);
  });

  it('boss phases refill the HP bar', () => {
    const rng = new Rng(9);
    const boss = makeEnemy('boss_jalter', 10);
    expect(boss.totalBars).toBe(2);
    const s = createBattle(rng, [inst(id0, 90)], [[boss]], 'boss');
    boss.hp = 1;
    for (let i = 0; i < 3 && boss.phases.length; i++) {
      s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
      executeTurn(s, rng);
    }
    expect(boss.phases).toHaveLength(0);
    expect(boss.maxHp).toBeGreaterThan(1);
  });

  it('an easy battle can be won', () => {
    const rng = new Rng(7);
    const s = createBattle(rng, [inst(id0, 60)], [[makeEnemy('zombie', 1)], [makeEnemy('zombie', 1)]], 'battle');
    for (let i = 0; i < 20 && s.status === 'player'; i++) {
      s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
      executeTurn(s, rng);
    }
    expect(s.status).toBe('won');
    expect(aliveEnemies(s)).toHaveLength(0);
  });
});

describe('progression', () => {
  it('levels stop at the cap and ascension lifts it', () => {
    const p = inst(id0, 1);
    gainExp(p, 1_000_000);
    expect(p.level).toBe(20);
    expect(canAscend(p, 1)).toBe(true);
    ascend(p);
    expect(p.ascension).toBe(1);
    gainExp(p, 1_000_000);
    expect(p.level).toBe(40);
  });
});

describe('map and run', () => {
  it('the map always has the same diamond shape and ends in a boss', () => {
    for (const seed of [1, 2, 3]) {
      const map = generateMap(new Rng(seed), 0);
      const nodes = Object.values(map.nodes);
      expect(nodes.length).toBe(MAP_ROWS.reduce((a, b) => a + b, 0) + 1);
      expect(nodes.filter((n) => n.type === 'boss')).toHaveLength(1);
      const reachable = new Set(map.startIds);
      for (const n of nodes.sort((a, b) => a.layer - b.layer)) if (reachable.has(n.id)) n.next.forEach((x) => reachable.add(x));
      expect(reachable.size).toBe(nodes.length);
    }
  });

  it('starter + Mash, and a duplicate summon raises NP level', () => {
    const run = newRun(123);
    chooseStarter(run, run.starterOptions[0]);
    expect(run.party.map((p) => p.defId)).toContain('mash');
    run.phase = 'gacha';
    run.gachaOptions = [run.party[0].defId];
    expect(recruit(run, run.party[0].defId)).toBe('npUp');
    expect(run.party[0].npLevel).toBe(2);
    enterNode(run, run.map.startIds[0]);
    expect(run.phase).toBe('battle');
  });
});
