import { SINGULARITIES } from '@/data/singularities';
import { nextSingularity } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';

export function SingularityClearScreen({ run }: { run: RunState }) {
  const cur = SINGULARITIES[run.singularity];
  const next = SINGULARITIES[run.singularity + 1];
  return (
    <div className="center-screen">
      <h2 className="screen-title">Singularidad {cur.code} corregida</h2>
      <div className="panel">
        <p>El Santo Grial de <b>{cur.name}</b> ha sido recuperado y la historia vuelve a su cauce.</p>
        {next ? (
          <>
            <p className="muted">Chaldea restaura a tu equipo y recuperas 1 Hechizo de Comando.</p>
            <p>Próxima Rayshift: <b>{next.code} · {next.name}</b> — {next.subtitle}</p>
            <button className="btn big gold" onClick={() => act(nextSingularity)} autoFocus>Rayshift</button>
          </>
        ) : (
          <button className="btn big gold" onClick={() => act(nextSingularity)} autoFocus>Restaurar la Orden Humana</button>
        )}
      </div>
    </div>
  );
}
