import { useState } from 'react';
import { getCraftEssence } from '@/data/craftEssences';
import { getServant } from '@/data/servants';
import { expToNext } from '@/game/constants';
import {
  ASCENSION_UNLOCK_TEXT, ascensionCost, canAscend, levelCap, statsFor,
} from '@/game/progression/leveling';
import { ascendServant, equipCraftEssence, moveServant, sealRevive } from '@/game/run';
import type { RunState } from '@/game/types';
import { act } from '@/store/gameStore';
import { Bar, ClassBadge, Portrait, Rarity } from './common';
import { CraftEssenceCard } from './CraftEssenceCard';
import { ServantSheet } from './ServantSheet';

export function PartyPanel({ run }: { run: RunState }) {
  const [detail, setDetail] = useState<string | null>(null);
  const [ceFor, setCeFor] = useState<string | null>(null);
  const locked = run.phase === 'battle';
  let frontCount = 0;

  return (
    <div className="party-panel">
      <p className="muted">
        The first 3 living Servants form the <b>front line</b>; the rest wait in reserve and step in when someone falls.
        {locked && ' (You cannot reorganise during a battle.)'}
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
          const ce = p.ce ? run.ces.find((c) => c.uid === p.ce) : undefined;
          return (
            <div key={p.uid} className={`party-row ${isFront ? 'front' : ''} ${alive ? '' : 'dead'}`}>
              <Portrait name={def.name} cls={def.cls} dead={!alive} />
              <div className="party-info">
                <div className="party-name">
                  {def.name} <Rarity n={def.rarity} /> <ClassBadge cls={def.cls} />
                  <span className="tag">{isFront ? 'Front line' : alive ? 'Reserve' : 'Fallen'}</span>
                </div>
                <div className="party-stats">
                  Lv. {p.level}/{cap} · ATK {atk} · Asc. {'◆'.repeat(p.ascension)}{'◇'.repeat(4 - p.ascension)} · NP{p.npLevel}
                  {p.np > 0 && ` · starts with ${p.np}% NP`}
                </div>
                <Bar value={p.hp} max={maxHp} label={`${p.hp} / ${maxHp}`} />
                <Bar value={p.level >= cap ? 1 : p.exp} max={p.level >= cap ? 1 : expToNext(p.level)} kind="exp" thin
                  label={p.level >= cap ? 'MAX LEVEL — ascend to keep growing' : undefined} />
                <button className="ce-slot" disabled={locked} onClick={() => setCeFor(ceFor === p.uid ? null : p.uid)}>
                  {ce ? <>✧ {getCraftEssence(ce.defId).name}</> : <span className="muted">✧ Equip Craft Essence</span>}
                </button>
              </div>
              <div className="party-buttons">
                <button className="btn small" disabled={locked || i === 0} onClick={() => act((r) => moveServant(r, p.uid, i - 1))}>▲</button>
                <button className="btn small" disabled={locked || i === run.party.length - 1} onClick={() => act((r) => moveServant(r, p.uid, i + 1))}>▼</button>
                <button className="btn small ghost" onClick={() => setDetail(detail === p.uid ? null : p.uid)}>Details</button>
                {cost !== null && (
                  <button
                    className={`btn small ${ascOk ? 'gold glow' : ''}`}
                    disabled={!ascOk || locked}
                    title={p.level < cap ? `Needs level ${cap}` : `Costs ${cost} ◆ — ${ASCENSION_UNLOCK_TEXT[p.ascension]}`}
                    onClick={() => act((r) => { ascendServant(r, p.uid); })}
                  >
                    Ascend ({cost}◆)
                  </button>
                )}
                {!alive && (
                  <button className="btn small danger" disabled={run.commandSeals <= 0 || locked}
                    title="Spend 1 Command Seal: revive with 50% HP"
                    onClick={() => act((r) => { sealRevive(r, p.uid); })}>
                    Revive ✠
                  </button>
                )}
              </div>
              {ceFor === p.uid && (
                <div className="party-detail ce-picker">
                  {run.ces.length === 0 && <p className="muted">No Craft Essences yet. Elites, bosses and treasures drop them.</p>}
                  {run.ces.map((c) => {
                    const holder = run.party.find((x) => x.ce === c.uid);
                    return (
                      <button key={c.uid} className={`ce-option ${p.ce === c.uid ? 'equipped' : ''}`}
                        onClick={() => { act((r) => equipCraftEssence(r, p.uid, p.ce === c.uid ? null : c.uid)); setCeFor(null); }}>
                        <CraftEssenceCard defId={c.defId} compact />
                        <small className="muted">
                          {p.ce === c.uid ? 'Equipped — click to remove' : holder ? `On ${getServant(holder.defId).name}` : 'Free'}
                        </small>
                      </button>
                    );
                  })}
                </div>
              )}
              {detail === p.uid && (
                <div className="party-detail">
                  <ServantSheet defId={p.defId} ascension={p.ascension} npLevel={p.npLevel} level={p.level} />
                  {cost !== null && (
                    <p className="muted">Next ascension: {ASCENSION_UNLOCK_TEXT[p.ascension]}, level cap {cap} → {Math.min(90, cap + 20)}.</p>
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
