import { getServant } from '@/data/servants';
import { SINGULARITIES } from '@/data/singularities';
import type { RunState } from '@/game/types';
import { startNewRun, toTitle } from '@/store/gameStore';
import { Portrait } from '../components/common';

export function EndScreen({ run }: { run: RunState }) {
  const win = run.phase === 'victory';
  const sing = SINGULARITIES[run.singularity];
  const minutes = Math.round((Date.now() - run.stats.startedAt) / 60000);
  return (
    <div className="center-screen">
      <h2 className={`screen-title ${win ? 'gold-text' : 'danger-text'}`}>
        {win ? 'La Orden Humana ha sido restaurada' : 'Fin de la Grand Order'}
      </h2>
      <div className="panel">
        <p>{win ? 'Has derrotado al Rey Demonio. Gracias, Master.' : `Tu viaje terminó en ${sing.code} · ${sing.name}.`}</p>
        <p className="muted">Combates: {run.stats.battles} · Turnos: {run.stats.turns} · Invocaciones: {run.stats.recruits} · {minutes} min</p>
        <div className="row wrap center">
          {run.party.map((p) => {
            const d = getServant(p.defId);
            return (
              <div key={p.uid} className="end-servant">
                <Portrait name={d.name} cls={d.cls} size={48} />
                <small>{d.name}<br />Nv. {p.level}</small>
              </div>
            );
          })}
        </div>
        <div className="row center">
          <button className="btn big gold" onClick={startNewRun}>Nueva partida</button>
          <button className="btn" onClick={toTitle}>Título</button>
        </div>
      </div>
    </div>
  );
}
