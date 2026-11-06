import { getServant } from '@/data/servants';
import { unlockedSkills } from '@/game/progression/leveling';
import { CardTypeTag, ClassBadge, Portrait, Rarity } from './common';

/** Ficha completa de un Servant: deck, skills (con bloqueo por ascensión) y NP. */
export function ServantSheet({ defId, ascension = 0, npLevel = 1, compact = false }: {
  defId: string; ascension?: number; npLevel?: number; compact?: boolean;
}) {
  const def = getServant(defId);
  const unlocked = unlockedSkills(ascension);
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
      {!compact && <p className="lore">{def.lore}</p>}
      <ul className="skill-list">
        {def.skills.map((s, i) => (
          <li key={s.id} className={i < unlocked ? '' : 'locked'}>
            <b>{i < unlocked ? '◆' : '🔒'} {s.name}</b> <small>CD {s.cooldown}</small>
            <div>{s.description}</div>
            {i >= unlocked && <small className="muted">Se desbloquea en la Ascensión {i}</small>}
          </li>
        ))}
      </ul>
      <div className="np-box">
        <div><b>NP · {def.np.name}</b> <small>{def.np.title}</small></div>
        <div><CardTypeTag type={def.np.card} /> {def.np.kind === 'aoe' ? 'Todos los enemigos' : def.np.kind === 'single' ? 'Un enemigo' : 'Apoyo'} · Nv. {npLevel}</div>
        <div className="muted">{def.np.description}</div>
      </div>
    </div>
  );
}
