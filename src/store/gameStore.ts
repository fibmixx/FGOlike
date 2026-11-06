// Store mínimo basado en useSyncExternalStore (sin dependencias externas).
// Cada acción clona la run → la muta con el motor → guarda en localStorage.
import { useSyncExternalStore } from 'react';
import type { BattleState, RunState } from '@/game/types';
import { newRun, withRng } from '@/game/run';
import { newSeed, type Rng } from '@/game/rng';
import { loadMeta, loadRun, saveMeta, saveRun, type MetaProgress } from '@/game/save';

export interface GameState {
  run: RunState | null;
  meta: MetaProgress;
  hasSave: boolean;
}

let state: GameState = {
  run: null,
  meta: loadMeta(),
  hasSave: loadRun() !== null,
};
const listeners = new Set<() => void>();

function set(next: Partial<GameState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function useGame(): GameState {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
  );
}

export const getGame = () => state;

function trackMeta(prev: RunState | null, run: RunState) {
  if (prev?.phase === run.phase) return;
  if (run.phase === 'gameover' || run.phase === 'victory') {
    const meta = {
      runs: state.meta.runs + 1,
      wins: state.meta.wins + (run.phase === 'victory' ? 1 : 0),
      bestSingularity: Math.max(state.meta.bestSingularity, run.singularity + (run.phase === 'victory' ? 1 : 0)),
    };
    saveMeta(meta);
    set({ meta });
  }
}

// ─── Acciones genéricas ──────────────────────────────────────

/** Aplica una mutación sobre una copia de la run y la persiste. */
export function act(fn: (run: RunState) => void) {
  if (!state.run) return;
  const prev = state.run;
  const run = structuredClone(prev);
  fn(run);
  trackMeta(prev, run);
  const finished = run.phase === 'gameover' || run.phase === 'victory';
  saveRun(finished ? null : run);
  set({ run, hasSave: !finished });
}

/** Igual que act, pero con acceso directo a la batalla y al RNG de la run. */
export function battleAct(fn: (b: BattleState, rng: Rng, run: RunState) => void) {
  act((run) => {
    if (!run.battle) return;
    withRng(run, (rng) => fn(run.battle!, rng, run));
  });
}

// ─── Ciclo de vida ───────────────────────────────────────────

export function startNewRun() {
  const run = newRun(newSeed());
  saveRun(run);
  set({ run, hasSave: true });
}

export function continueRun() {
  const run = loadRun();
  if (run) set({ run });
  else set({ hasSave: false });
}

export function toTitle() {
  set({ run: null, hasSave: loadRun() !== null });
}

export function abandonRun() {
  saveRun(null);
  set({ run: null, hasSave: false });
}
