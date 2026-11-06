import { useState } from 'react';
import { getServant } from '@/data/servants';
import { previewRecruit, recruit, skipGacha } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { Portrait } from '../components/common';
import { ServantSheet } from '../components/ServantSheet';

export function GachaScreen({ run }: { run: RunState }) {
  const [replaceFor, setReplaceFor] = useState<string | null>(null);
  const avgLevel = Math.round(run.party.reduce((s, p) => s + p.level, 0) / Math.max(1, run.party.length));

  const choose = (id: string) => {
    const outcome = previewRecruit(run, id);
    if (outcome === 'needsReplace') setReplaceFor(id);
    else act((r) => { recruit(r, id); });
  };

  return (
    <div className="center-screen gacha">
      <h2 className="screen-title">✦ Summoning ✦</h2>
      <p className="muted">Three Heroic Spirits answer your call. You may contract only one.</p>
      {run.gachaSeal && <p className="seal-found">✠ A Command Seal answered the summon as well! (+1 Command Seal)</p>}
      <div className="choice-grid">
        {run.gachaOptions.map((id) => {
          const outcome = previewRecruit(run, id);
          const def = getServant(id);
          return (
            <button key={id} className={`choice-card rarity-${def.rarity}`} onClick={() => choose(id)}>
              <ServantSheet defId={id} level={avgLevel} />
              <span className="btn gold">
                {outcome === 'npUp' ? 'Already owned → NP +1' : outcome === 'needsReplace' ? 'Contract (party full)' : 'Form a contract'}
              </span>
            </button>
          );
        })}
      </div>
      <button className="btn ghost" onClick={() => act(skipGacha)}>Leave without contracting</button>

      {replaceFor && (
        <div className="modal-backdrop" onClick={() => setReplaceFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header"><h2>Party full: who will you release?</h2></header>
            <div className="modal-body stack">
              {run.party.map((p) => {
                const def = getServant(p.defId);
                return (
                  <button key={p.uid} className="mini-servant btn-row" onClick={() => act((r) => { recruit(r, replaceFor, p.uid); })}>
                    <Portrait name={def.name} cls={def.cls} size={40} dead={p.hp <= 0} />
                    <span className="grow">{def.name} · Lv. {p.level} · NP{p.npLevel}</span>
                    <span className="danger-text">Release</span>
                  </button>
                );
              })}
              <button className="btn ghost" onClick={() => setReplaceFor(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
