import { getServant } from '@/data/servants';
import { SINGULARITIES } from '@/data/singularities';
import { NODE_INFO } from '@/game/constants';
import { availableNodes } from '@/game/map/generator';
import { levelCap, statsFor } from '@/game/progression/leveling';
import { enterNode } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { Bar, Portrait } from '../components/common';

const W = 520;
const ROW = 92;
const PAD = 50;

export function MapScreen({ run }: { run: RunState }) {
  const sing = SINGULARITIES[run.singularity];
  const { map } = run;
  const nodes = Object.values(map.nodes);
  const H = PAD * 2 + ROW * (map.layers - 1);
  // La capa 0 abajo, el jefe arriba
  const pos = (id: string) => {
    const n = map.nodes[id];
    return { x: PAD + n.x * (W - PAD * 2), y: H - PAD - n.layer * ROW };
  };
  const available = new Set(availableNodes(map, run.currentNode));
  const frontUids = new Set(run.party.filter((p) => p.hp > 0).slice(0, 3).map((p) => p.uid));

  return (
    <div className="map-layout" style={{ background: `linear-gradient(180deg, ${sing.theme.to}, ${sing.theme.from})` }}>
      <section className="map-panel">
        <div className="map-header">
          <h2>Singularidad {sing.code}: {sing.name}</h2>
          <p className="muted">{sing.subtitle}</p>
        </div>
        <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} style={{ ['--accent' as string]: sing.theme.accent }}>
          {nodes.flatMap((n) =>
            n.next.map((to) => {
              const a = pos(n.id);
              const b = pos(to);
              const active = n.id === run.currentNode && available.has(to);
              const travelled = n.visited && map.nodes[to].visited;
              return (
                <line key={`${n.id}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                  className={`edge ${active ? 'active' : ''} ${travelled ? 'travelled' : ''}`} />
              );
            }),
          )}
          {nodes.map((n) => {
            const { x, y } = pos(n.id);
            const can = available.has(n.id);
            const isCurrent = n.id === run.currentNode;
            const info = NODE_INFO[n.type];
            const r = n.type === 'boss' ? 30 : 21;
            return (
              <g key={n.id}
                className={`node node-${n.type} ${can ? 'available' : ''} ${n.visited ? 'visited' : ''} ${isCurrent ? 'current' : ''}`}
                transform={`translate(${x},${y})`}
                onClick={() => can && act((r2) => enterNode(r2, n.id))}
                role={can ? 'button' : undefined}
              >
                <title>{info.label}</title>
                <circle r={r} />
                <text dy="0.36em">{info.icon}</text>
              </g>
            );
          })}
        </svg>
        <div className="legend">
          {Object.entries(NODE_INFO).map(([k, v]) => <span key={k}><b>{v.icon}</b> {v.label}</span>)}
        </div>
      </section>
      <aside className="map-side">
        <h3>Equipo</h3>
        {run.party.map((p) => {
          const def = getServant(p.defId);
          const { maxHp } = statsFor(p);
          return (
            <div key={p.uid} className={`mini-servant ${p.hp <= 0 ? 'dead' : ''}`}>
              <Portrait name={def.name} cls={def.cls} size={40} dead={p.hp <= 0} />
              <div className="grow">
                <div className="mini-name">{frontUids.has(p.uid) && <span className="front-dot" title="Primera línea">●</span>} {def.name}</div>
                <small className="muted">Nv. {p.level}/{levelCap(p)} · NP{p.npLevel}</small>
                <Bar value={p.hp} max={maxHp} thin />
              </div>
            </div>
          );
        })}
        <p className="muted small">Pulsa en un nodo iluminado para avanzar. Gestiona formación y ascensiones desde <b>Equipo</b>.</p>
      </aside>
    </div>
  );
}
