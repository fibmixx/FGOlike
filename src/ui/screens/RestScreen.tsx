import { statsFor } from '@/game/progression/leveling';
import { rest } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';

export function RestScreen({ run }: { run: RunState }) {
  const missing = run.party.reduce((s, p) => s + (statsFor(p).maxHp - p.hp), 0);
  const fallen = run.party.filter((p) => p.hp <= 0).length;
  return (
    <div className="center-screen">
      <h2 className="screen-title">♨ Camp</h2>
      <p className="muted">A quiet night by the fire. How will you spend it?</p>
      <div className="choice-grid two">
        <button className="choice-card rest-card" onClick={() => act((r) => rest(r, 'heal'))}>
          <div className="big-icon">♨</div>
          <h3>Rest</h3>
          <p>The whole party recovers all HP{fallen ? `, and ${fallen} fallen Servant(s) return to battle` : ''}.</p>
          <small className="muted">Missing HP: {missing}</small>
        </button>
        <button className="choice-card rest-card" onClick={() => act((r) => rest(r, 'train'))}>
          <div className="big-icon">⚔</div>
          <h3>Train</h3>
          <p>Living Servants gain EXP worth about 3 levels. No healing.</p>
          <small className="muted">Level caps still apply.</small>
        </button>
      </div>
    </div>
  );
}
