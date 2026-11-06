import { useState } from 'react';
import { getServant } from '@/data/servants';
import { previewRecruit, recruit, skipGacha } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { Portrait } from '../components/common';
import { ServantSheet } from '../components/ServantSheet';

export function GachaScreen({ run }: { run: RunState }) {
  const [replaceFor, setReplaceFor] = useState<string | null>(null);

  const choose = (id: string) => {
    const outcome = previewRecruit(run, id);
    if (outcome === 'needsReplace') setReplaceFor(id);
    else act((r) => { recruit(r, id); });
  };

  return (
    <div className="center-screen gacha">
      <h2 className="screen-title">✦ Invocación del Santo Grial ✦</h2>
      <p className="muted">Tres Espíritus Heroicos responden a tu llamada. Solo puedes contratar a uno.</p>
      <div className="choice-grid">
        {run.gachaOptions.map((id) => {
          const outcome = previewRecruit(run, id);
          const def = getServant(id);
          return (
            <button key={id} className={`choice-card rarity-${def.rarity}`} onClick={() => choose(id)}>
              <ServantSheet defId={id} />
              <span className="btn gold">
                {outcome === 'npUp' ? 'Ya lo tienes → NP +1' : outcome === 'needsReplace' ? 'Contratar (equipo lleno)' : 'Contratar'}
              </span>
            </button>
          );
        })}
      </div>
      <button className="btn ghost" onClick={() => act(skipGacha)}>No contratar a nadie</button>

      {replaceFor && (
        <div className="modal-backdrop" onClick={() => setReplaceFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header"><h2>Equipo lleno: ¿a quién liberas?</h2></header>
            <div className="modal-body stack">
              {run.party.map((p) => {
                const def = getServant(p.defId);
                return (
                  <button key={p.uid} className="mini-servant btn-row" onClick={() => act((r) => { recruit(r, replaceFor, p.uid); })}>
                    <Portrait name={def.name} cls={def.cls} size={40} dead={p.hp <= 0} />
                    <span className="grow">{def.name} · Nv. {p.level} · NP{p.npLevel}</span>
                    <span className="danger-text">Liberar</span>
                  </button>
                );
              })}
              <button className="btn ghost" onClick={() => setReplaceFor(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
