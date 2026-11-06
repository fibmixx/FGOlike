import { RUN_VERSION } from './run';
import type { RunState } from './types';

const KEY = 'fgolike.run';
const META_KEY = 'fgolike.meta';

export interface MetaProgress {
  runs: number;
  wins: number;
  bestSingularity: number;
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState | null) {
  const st = storage();
  if (!st) return;
  try {
    if (run) st.setItem(KEY, JSON.stringify(run));
    else st.removeItem(KEY);
  } catch {
    /* almacenamiento lleno o bloqueado: ignorar */
  }
}

export function loadRun(): RunState | null {
  const st = storage();
  if (!st) return null;
  try {
    const raw = st.getItem(KEY);
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    return run.version === RUN_VERSION ? run : null;
  } catch {
    return null;
  }
}

export function loadMeta(): MetaProgress {
  const st = storage();
  try {
    const raw = st?.getItem(META_KEY);
    if (raw) return JSON.parse(raw) as MetaProgress;
  } catch { /* noop */ }
  return { runs: 0, wins: 0, bestSingularity: 0 };
}

export function saveMeta(meta: MetaProgress) {
  try {
    storage()?.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* noop */ }
}
