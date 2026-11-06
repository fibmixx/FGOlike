import { describe, expect, it } from 'vitest';
import { SERVANTS, getServant } from '@/data/servants';
import { classAffinity } from '@/game/constants';
import {
  aliveEnemies, createBattle, describeChain, executeTurn, toggleSelect,
} from '@/game/combat/battle';
import { computeDamage } from '@/game/combat/damage';
import { makeAlly, makeEnemy } from '@/game/combat/factory';
import { generateMap } from '@/game/map/generator';
import { ascend, canAscend, gainExp } from '@/game/progression/leveling';
import { Rng } from '@/game/rng';
import { chooseStarter, newRun, recruit, enterNode } from '@/game/run';
import type { ServantInstance } from '@/game/types';

const inst = (defId: string, level = 10): ServantInstance => ({ uid: `u_${defId}`, defId, level, exp: 0, ascension: 0, npLevel: 1, hp: 99999 });

describe('datos', () => {
  it('todos los Servants tienen 5 cartas y 3 skills', () => {
    for (const s of SERVANTS) {
      expect(s.deck).toHaveLength(5);
      expect(s.skills).toHaveLength(3);
    }
  });
});

describe('afinidad de clases', () => {
  it('triángulo de caballería', () => {
    expect(classAffinity('Saber', 'Lancer')).toBe(2);
    expect(classAffinity('Lancer', 'Saber')).toBe(0.5);
    expect(classAffinity('Rider', 'Caster')).toBe(2);
    expect(classAffinity('Berserker', 'Shielder')).toBe(1);
    expect(classAffinity('Shielder', 'Berserker')).toBe(1);
  });
});

describe('daño', () => {
  it('Buster > Arts > Quick y el crítico duplica', () => {
    const a = makeAlly(inst('artoria'));
    const e = makeEnemy('skeleton', 10);
    const base = { posMod: 1, busterFirst: false, crit: false, busterChain: false, random: 1 };
    const b = computeDamage(a, e, { ...base, card: 'Buster' });
    const ar = computeDamage(a, e, { ...base, card: 'Arts' });
    const q = computeDamage(a, e, { ...base, card: 'Quick' });
    expect(b).toBeGreaterThan(ar);
    expect(ar).toBeGreaterThan(q);
    expect(computeDamage(a, e, { ...base, card: 'Buster', crit: true })).toBe(b * 2);
  });
});

describe('combate', () => {
  it('una cadena de 3 cartas resuelve un turno', () => {
    const rng = new Rng(42);
    const party = [inst('artoria', 30), inst('mash', 30)];
    const s = createBattle(rng, party, [[makeEnemy('skeleton', 1)]], 'battle');
    expect(s.hand).toHaveLength(5);
    s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
    expect(s.selected).toHaveLength(3);
    executeTurn(s, rng);
    expect(s.turn === 2 || s.status === 'won').toBe(true);
  });

  it('Brave chain se detecta', () => {
    const rng = new Rng(1);
    const s = createBattle(rng, [inst('artoria')], [[makeEnemy('skeleton', 1)]], 'battle');
    s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
    expect(describeChain(s).brave).toBe(true); // un solo Servant → siempre brave
  });

  it('se puede ganar un combate fácil', () => {
    const rng = new Rng(7);
    const s = createBattle(rng, [inst('heracles', 40)], [[makeEnemy('zombie', 1)], [makeEnemy('zombie', 1)]], 'battle');
    for (let i = 0; i < 20 && s.status === 'player'; i++) {
      s.hand.slice(0, 3).forEach((c) => toggleSelect(s, c.id));
      executeTurn(s, rng);
    }
    expect(s.status).toBe('won');
    expect(aliveEnemies(s)).toHaveLength(0);
  });
});

describe('progresión', () => {
  it('el nivel se detiene en el tope y la ascensión lo libera', () => {
    const p = inst('cu', 1);
    gainExp(p, 1_000_000);
    expect(p.level).toBe(20);
    expect(canAscend(p, 1)).toBe(true);
    ascend(p);
    expect(p.ascension).toBe(1);
    gainExp(p, 1_000_000);
    expect(p.level).toBe(40);
  });
});

describe('mapa y run', () => {
  it('el mapa termina en un jefe y todos los nodos son alcanzables', () => {
    const map = generateMap(new Rng(3), 0);
    const nodes = Object.values(map.nodes);
    expect(nodes.filter((n) => n.type === 'boss')).toHaveLength(1);
    const reachable = new Set(map.startIds);
    for (const n of nodes.sort((a, b) => a.layer - b.layer)) if (reachable.has(n.id)) n.next.forEach((x) => reachable.add(x));
    expect(reachable.size).toBe(nodes.length);
  });

  it('flujo inicial: starter + Mash, y duplicado del gacha sube NP', () => {
    const run = newRun(123);
    chooseStarter(run, run.starterOptions[0]);
    expect(run.party.map((p) => p.defId)).toContain('mash');
    run.phase = 'gacha';
    run.gachaOptions = [run.party[0].defId];
    expect(recruit(run, run.party[0].defId)).toBe('npUp');
    expect(run.party[0].npLevel).toBe(2);
    enterNode(run, run.map.startIds[0]);
    expect(run.phase).toBe('battle');
    expect(getServant(run.party[0].defId)).toBeTruthy();
  });
});
