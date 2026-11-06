import { getServant } from '@/data/servants';
import { skillLevelFor } from '@/game/constants';
import { describeEffects, describeNp, resolveNp, resolveSkill } from '@/game/effects';
import { unlockedSkills } from '@/game/progression/leveling';
import { CardTypeTag, ClassBadge, Portrait, Rarity } from './common';

/** Full servant sheet: deck, skills (locked by ascension), passives and NP. */
export function ServantSheet({ defId, ascension = 0, npLevel = 1, level = 1, compact = false }: {
  defId: string; ascension?: number; npLevel?: number; level?: number; compact?: boolean;
}) {
  const def = getServant(defId);
  const unlocked = unlockedSkills(ascension);
  const skillLv = skillLevelFor(level);
  const np = resolveNp(def.np, npLevel);
  return (
    <div className={`sheet ${compact ? 'compact' : ''}`}>
      <div className="sheet-head">
        <Portrait name={def.name} cls={def.cls} size={compact ? 48 : 64} />
        <div>
          <div className="sheet-name">{def.name}</div>
          <div className="sheet-meta"><Rarity n={def.rarity} /> <ClassBadge cls={def.cls} /></div>
          <div className="deck">{def.deck.map((c, i) => <CardTypeTag key={i} type={c} />)}</div>
        </div>
      </div>
      <ul className="skill-list">
        {def.skills.map((raw, i) => {
          const s = resolveSkill(raw, skillLv);
          return (
            <li key={raw.id + i} className={i < unlocked ? '' : 'locked'}>
              <b>{i < unlocked ? '◆' : '🔒'} {s.name}</b> <small className="muted">Lv.{skillLv} · CD {s.cooldown}</small>
              {describeEffects(s.effects).map((t, j) => <div key={j} className="fx-line">{t}</div>)}
              {i >= unlocked && <small className="muted">Unlocks at Ascension {i}</small>}
            </li>
          );
        })}
      </ul>
      {!compact && def.passives?.length ? (
        <div className="passives">
          {def.passives.map((p, i) => (
            <span key={i} className="passive" title={describeEffects(p.effects).join(' · ')}>{p.name}</span>
          ))}
        </div>
      ) : null}
      <div className="np-box">
        <div><b>NP · {np.name}</b> {np.title && <small className="muted">{np.title}</small>}</div>
        <div><CardTypeTag type={np.card} /> {np.kind === 'aoe' ? 'All enemies' : np.kind === 'single' ? 'Single target' : 'Support'} · NP{npLevel}</div>
        {describeNp(np).map((t, j) => <div key={j} className="muted fx-line">{t}</div>)}
      </div>
    </div>
  );
}
