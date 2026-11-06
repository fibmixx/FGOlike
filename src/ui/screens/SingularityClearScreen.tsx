import { SINGULARITIES } from '@/data/singularities';
import { nextSingularity } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';

export function SingularityClearScreen({ run }: { run: RunState }) {
  const cur = SINGULARITIES[run.singularity];
  const next = SINGULARITIES[run.singularity + 1];
  return (
    <div className="center-screen">
      <h2 className="screen-title">Singularity {cur.code} Corrected</h2>
      <div className="panel">
        <p>The Holy Grail of <b>{cur.name}</b> has been recovered and history returns to its course.</p>
        {next ? (
          <>
            <p className="muted">Chaldea restores your party and your Mystic Code recharges. Command Seals do not return.</p>
            <p>Next Rayshift: <b>{next.code} · {next.name}</b> — {next.subtitle}</p>
            <button className="btn big gold" onClick={() => act(nextSingularity)} autoFocus>Rayshift</button>
          </>
        ) : (
          <button className="btn big gold" onClick={() => act(nextSingularity)} autoFocus>Restore Human Order</button>
        )}
      </div>
    </div>
  );
}
