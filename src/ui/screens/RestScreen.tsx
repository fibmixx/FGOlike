import { statsFor } from '@/game/progression/leveling';
import { rest } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';

export function RestScreen({ run }: { run: RunState }) {
  const missing = run.party.reduce((s, p) => s + (statsFor(p).maxHp - p.hp), 0);
  const fallen = run.party.filter((p) => p.hp <= 0).length;
  return (
    <div className="center-screen">
      <h2 className="screen-title">♨ Campamento</h2>
      <p className="muted">Una noche tranquila junto al fuego. Elige cómo aprovecharla.</p>
      <div className="choice-grid two">
        <button className="choice-card rest-card" onClick={() => act((r) => rest(r, 'heal'))}>
          <div className="big-icon">♨</div>
          <h3>Descansar</h3>
          <p>Todo el equipo recupera la vida al completo{fallen ? ` y ${fallen} Servant(s) caído(s) vuelven a la batalla` : ''}.</p>
          <small className="muted">Vida que falta: {missing}</small>
        </button>
        <button className="choice-card rest-card" onClick={() => act((r) => rest(r, 'train'))}>
          <div className="big-icon">⚔</div>
          <h3>Entrenar</h3>
          <p>Los Servants vivos ganan EXP equivalente a ~3 niveles. No cura.</p>
          <small className="muted">Respeta el nivel máximo de cada ascensión.</small>
        </button>
      </div>
    </div>
  );
}
