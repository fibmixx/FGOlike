import { getServant } from '@/data/servants';
import { continueFromResult } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';

export function ResultScreen({ run }: { run: RunState }) {
  const r = run.lastReward;
  return (
    <div className="center-screen">
      <h2 className="screen-title">Battle Results</h2>
      <div className="panel result">
        <p>EXP gained: <b>{r?.exp ?? 0}</b> <span className="muted">(reserve gets half)</span></p>
        {!!r?.crystals && <p className="gold-text">+{r.crystals} Ascension Crystal(s) ◆</p>}
        {r?.levelUps.length ? (
          <ul className="levelups">
            {r.levelUps.map((l) => {
              const inst = run.party.find((p) => p.uid === l.uid);
              return inst && <li key={l.uid}><b>{getServant(inst.defId).name}</b> Lv. {l.from} → <b>{l.to}</b></li>;
            })}
          </ul>
        ) : <p className="muted">No level ups.</p>}
        <button className="btn big gold" onClick={() => act(continueFromResult)} autoFocus>Continue</button>
      </div>
    </div>
  );
}
