import { chooseStarter } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { ServantSheet } from '../components/ServantSheet';

export function StarterScreen({ run }: { run: RunState }) {
  return (
    <div className="center-screen">
      <h2 className="screen-title">Invocación inicial</h2>
      <p className="muted">El sistema de invocación FATE responde. Elige a tu primer Servant — Mash Kyrielight te acompañará también.</p>
      <div className="choice-grid">
        {run.starterOptions.map((id) => (
          <button key={id} className="choice-card" onClick={() => act((r) => chooseStarter(r, id))}>
            <ServantSheet defId={id} />
            <span className="btn gold">Contratar</span>
          </button>
        ))}
      </div>
    </div>
  );
}
