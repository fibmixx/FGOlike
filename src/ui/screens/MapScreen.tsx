import { getServant } from '@/data/servants';
import { SINGULARITIES } from '@/data/singularities';
import { NODE_INFO } from '@/game/constants';
import { availableNodes } from '@/game/map/generator';
import { levelCap, statsFor } from '@/game/progression/leveling';
import { enterNode } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { Bar, Portrait } from '../components/common';

const W = 460;
const ROW = 78;
const PAD = 46;

export function MapScreen({ run }: { run: RunState }) {
  const sing = SINGULARITIES[run.singularity];
  const { map } = run;
  const nodes = Object.values(map.nodes);
  // layers + 1 extra row at the bottom for the Rayshift point
  const H = PAD * 2 + ROW * map.layers;
  const pos = (id: string) => {
    const n = map.nodes[id];
    return { x: PAD + n.x * (W - PAD * 2), y: H - PAD - (n.layer + 1) * ROW };
  };
  const start = { x: W / 2, y: H - PAD };
  const available = new Set(availableNodes(map, run.currentNode));
  const frontUids = new Set(run.party.filter((p) => p.hp > 0).slice(0, 3).map((p) => p.uid));

  return (
    <div className="map-layout" style={{ background: `linear-gradient(180deg, ${sing.theme.to}, ${sing.theme.from})` }}>
      <section className="map-panel">
        <div className="map-header">
          <h2>Singularity {sing.code}: {sing.name}</h2>
          <p className="muted">{sing.subtitle}</p>
        </div>
        <svg className="map-svg" viewBox={`0 0 ${W} ${H}`} style={{ ['--accent' as string]: sing.theme.accent }}>
          {map.startIds.map((id) => {
            const b = pos(id);
            return <line key={`start-${id}`} x1={start.x} y1={start.y} x2={b.x} y2={b.y}
              className={`edge ${run.currentNode === null ? 'active' : map.nodes[id].visited ? 'travelled' : ''}`} />;
          })}
          {nodes.flatMap((n) =>
            n.next.map((to) => {
              const a = pos(n.id);
              const b = pos(to);
              const active = n.id === run.currentNode && available.has(to);
              const travelled = n.visited && map.nodes[to].visited;
              return <line key={`${n.id}-${to}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                className={`edge ${active ? 'active' : ''} ${travelled ? 'travelled' : ''}`} />;
            }),
          )}
          <g className="node start" transform={`translate(${start.x},${start.y})`}>
            <title>Rayshift point</title>
            <circle r={17} />
            <text dy="0.36em">▲</text>
          </g>
          {nodes.map((n) => {
            const { x, y } = pos(n.id);
            const can = available.has(n.id);
            const isCurrent = n.id === run.currentNode;
            const info = NODE_INFO[n.type];
            const r = n.type === 'boss' ? 28 : 20;
            return (
              <g key={n.id}
                className={`node node-${n.type} ${can ? 'available' : ''} ${n.visited ? 'visited' : ''} ${isCurrent ? 'current' : ''}`}
                transform={`translate(${x},${y})`}
                onClick={() => can && act((r2) => enterNode(r2, n.id))}
                role={can ? 'button' : undefined}
              >
                <title>{info.label}</title>
                <circle r={r} />
                <text dy="0.36em">{n.visited && !isCurrent ? '✓' : info.icon}</text>
              </g>
            );
          })}
        </svg>
        <div className="legend">
          {Object.entries(NODE_INFO).map(([k, v]) => <span key={k}><b>{v.icon}</b> {v.label}</span>)}
        </div>
      </section>
      <aside className="map-side">
        <h3>Party</h3>
        {run.party.map((p) => {
          const def = getServant(p.defId);
          const { maxHp } = statsFor(p);
          return (
            <div key={p.uid} className={`mini-servant ${p.hp <= 0 ? 'dead' : ''}`}>
              <Portrait name={def.name} cls={def.cls} size={40} dead={p.hp <= 0} />
              <div className="grow">
                <div className="mini-name">{frontUids.has(p.uid) && <span className="front-dot" title="Front line">●</span>} {def.name}</div>
                <small className="muted">Lv. {p.level}/{levelCap(p)} · NP{p.npLevel}{p.np > 0 ? ` · ${p.np}% NP` : ''}{p.ce ? ' · ✧' : ''}</small>
                <Bar value={p.hp} max={maxHp} thin />
              </div>
            </div>
          );
        })}
        <div className="mystic-status">
          <span className="muted small">Mystic Code this Singularity:</span>{' '}
          {run.mysticUsed.map((u, i) => <span key={i} className={`mc-pip ${u ? 'used' : ''}`}>✧</span>)}
        </div>
        <p className="muted small">Click a glowing node to advance. Manage formation, ascensions and Craft Essences in <b>Party</b>.</p>
      </aside>
    </div>
  );
}
