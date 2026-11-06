import { useState } from 'react';
import { getServant } from '@/data/servants';
import { expToNext } from '@/game/constants';
import {
  ASCENSION_UNLOCK_TEXT, ascensionCost, canAscend, levelCap, statsFor,
} from '@/game/progression/leveling';
import { ascendServant, moveServant, sealRevive } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { Bar, ClassBadge, Portrait, Rarity } from './common';
import { ServantSheet } from './ServantSheet';

export function PartyPanel({ run }: { run: RunState }) {
  const [detail, setDetail] = useState<string | null>(null);
  const locked = run.phase === 'battle';
  let frontCount = 0;

  return (
    <div className="party-panel">
      <p className="muted">
        Los 3 primeros Servants vivos forman la <b>primera línea</b>; el resto espera en reserva y entra cuando alguien cae.
        {locked && ' (No puedes reorganizar durante un combate.)'}
      </p>
      <div className="party-list">
        {run.party.map((p, i) => {
          const def = getServant(p.defId);
          const { maxHp, atk } = statsFor(p);
          const cap = levelCap(p);
          const cost = ascensionCost(p);
          const alive = p.hp > 0;
          const isFront = alive && frontCount++ < 3;
          const ascOk = canAscend(p, run.crystals);
          return (
            <div key={p.uid} className={`party-row ${isFront ? 'front' : ''} ${alive ? '' : 'dead'}`}>
              <Portrait name={def.name} cls={def.cls} dead={!alive} />
              <div className="party-info">
                <div className="party-name">
                  {def.name} <Rarity n={def.rarity} /> <ClassBadge cls={def.cls} />
                  <span className="tag">{isFront ? 'Primera línea' : alive ? 'Reserva' : 'Caído'}</span>
                </div>
                <div className="party-stats">
                  Nv. {p.level}/{cap} · ATK {atk} · Asc. {'◆'.repeat(p.ascension)}{'◇'.repeat(4 - p.ascension)} · NP Nv.{p.npLevel}
                </div>
                <Bar value={p.hp} max={maxHp} label={`${p.hp} / ${maxHp}`} />
                <Bar value={p.level >= cap ? 1 : p.exp} max={p.level >= cap ? 1 : expToNext(p.level)} kind="exp" thin
                  label={p.level >= cap ? 'NIVEL MÁXIMO — asciende para seguir' : undefined} />
              </div>
              <div className="party-buttons">
                <button className="btn small" disabled={locked || i === 0} onClick={() => act((r) => moveServant(r, p.uid, i - 1))}>▲</button>
                <button className="btn small" disabled={locked || i === run.party.length - 1} onClick={() => act((r) => moveServant(r, p.uid, i + 1))}>▼</button>
                <button className="btn small ghost" onClick={() => setDetail(detail === p.uid ? null : p.uid)}>Ficha</button>
                {cost !== null && (
                  <button
                    className={`btn small ${ascOk ? 'gold glow' : ''}`}
                    disabled={!ascOk || locked}
                    title={p.level < cap ? `Necesita nivel ${cap}` : `Cuesta ${cost} ◆ — ${ASCENSION_UNLOCK_TEXT[p.ascension]}`}
                    onClick={() => act((r) => { ascendServant(r, p.uid); })}
                  >
                    Ascender ({cost}◆)
                  </button>
                )}
                {!alive && (
                  <button className="btn small danger" disabled={run.commandSeals <= 0 || locked}
                    title="Gasta 1 Hechizo de Comando: revive con 50% de vida"
                    onClick={() => act((r) => { sealRevive(r, p.uid); })}>
                    Revivir ✠
                  </button>
                )}
              </div>
              {detail === p.uid && (
                <div className="party-detail">
                  <ServantSheet defId={p.defId} ascension={p.ascension} npLevel={p.npLevel} />
                  {cost !== null && (
                    <p className="muted">Siguiente ascensión: {ASCENSION_UNLOCK_TEXT[p.ascension]} y nivel máximo {cap} → {cap + 20 > 90 ? 90 : cap + 20}.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
