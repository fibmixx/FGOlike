import { chooseCraftEssence } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { CraftEssenceCard } from '../components/CraftEssenceCard';

export function CeRewardScreen({ run }: { run: RunState }) {
  return (
    <div className="center-screen">
      <h2 className="screen-title">✧ Craft Essence</h2>
      <p className="muted">{run.treasureText ?? 'Spoils of battle. Choose one Craft Essence — equip it from the Party screen.'}</p>
      <div className="choice-grid">
        {run.ceOptions.map((id) => (
          <button key={id} className="choice-card ce-choice" onClick={() => act((r) => chooseCraftEssence(r, id))}>
            <CraftEssenceCard defId={id} />
            <span className="btn gold">Take</span>
          </button>
        ))}
      </div>
      <button className="btn ghost" onClick={() => act((r) => chooseCraftEssence(r, null))}>Skip</button>
    </div>
  );
}
