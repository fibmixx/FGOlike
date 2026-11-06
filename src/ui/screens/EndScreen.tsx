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
        {win ? 'Human Order Restored' : 'The Grand Order Ends'}
      </h2>
      <div className="panel">
        <p>{win ? 'You defeated the Demon King. Thank you, Master.' : `Your journey ended at ${sing.code} · ${sing.name}.`}</p>
        <p className="muted">Battles: {run.stats.battles} · Turns: {run.stats.turns} · Summons: {run.stats.recruits} · {minutes} min</p>
        <div className="row wrap center">
          {run.party.map((p) => {
            const d = getServant(p.defId);
            return (
              <div key={p.uid} className="end-servant">
                <Portrait name={d.name} cls={d.cls} size={48} />
                <small>{d.name}<br />Lv. {p.level}</small>
              </div>
            );
          })}
        </div>
        <div className="row center">
          <button className="btn big gold" onClick={startNewRun}>New run</button>
          <button className="btn" onClick={toTitle}>Title</button>
        </div>
      </div>
    </div>
  );
}
