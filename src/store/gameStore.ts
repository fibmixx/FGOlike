// Minimal store on top of useSyncExternalStore (no dependencies).
// Each action clones the run → mutates it with the engine → saves to localStorage.
import { useSyncExternalStore } from 'react';
import type { BattleState, RunState } from '@/game/types';
import { newRun, withRng } from '@/game/run';
import { newSeed, type Rng } from '@/game/rng';
import { loadMeta, loadRun, saveMeta, saveRun, type MetaProgress } from '@/game/save';

export type BattleSpeed = 1 | 2 | 4;

export interface GameState {
  run: RunState | null;
  meta: MetaProgress;
  hasSave: boolean;
  speed: BattleSpeed;
}

function loadSpeed(): BattleSpeed {
  try {
    const v = Number(localStorage.getItem('fgolike.speed'));
    return v === 2 || v === 4 ? v : 1;
  } catch { return 1; }
}

let state: GameState = {
  run: null,
  meta: loadMeta(),
  hasSave: loadRun() !== null,
  speed: loadSpeed(),
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

// ─── Generic actions ────────────────────────────────────────

/** Applies a mutation to a copy of the run and persists it. */
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

/** Like act, with direct access to the battle and the run's RNG. */
export function battleAct(fn: (b: BattleState, rng: Rng, run: RunState) => void) {
  act((run) => {
    if (!run.battle) return;
    withRng(run, (rng) => fn(run.battle!, rng, run));
  });
}

export function setSpeed(speed: BattleSpeed) {
  try { localStorage.setItem('fgolike.speed', String(speed)); } catch { /* noop */ }
  set({ speed });
}

// ─── Lifecycle ──────────────────────────────────────────────

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
