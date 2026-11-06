import { closeTreasure } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';

export function TreasureScreen({ run }: { run: RunState }) {
  return (
    <div className="center-screen">
      <h2 className="screen-title">◈ Treasure</h2>
      <div className="panel">
        <p>{run.treasureText}</p>
        <button className="btn big gold" onClick={() => act(closeTreasure)} autoFocus>Continue</button>
      </div>
    </div>
  );
}
