import { chooseStarter } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { ServantSheet } from '../components/ServantSheet';

export function StarterScreen({ run }: { run: RunState }) {
  return (
    <div className="center-screen">
      <h2 className="screen-title">First Summon</h2>
      <p className="muted">The summoning system FATE responds. Choose your first Servant — Mash Kyrielight will join you as well.</p>
      <div className="choice-grid">
        {run.starterOptions.map((id) => (
          <button key={id} className="choice-card" onClick={() => act((r) => chooseStarter(r, id))}>
            <ServantSheet defId={id} level={5} />
            <span className="btn gold">Form a contract</span>
          </button>
        ))}
      </div>
    </div>
  );
}
