import type { ReactNode } from 'react';
import { CLASS_COLOR, CLASS_LABEL } from '@/game/constants';
import type { CardType, ServantClass } from '@/game/types';
import { ClassIcon } from './ClassIcon';

function initials(name: string) {
  return name.replace(/\(.*?\)|〔.*?〕/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** Placeholder portrait: class gradient + initials + class glyph. Swap for real art later. */
export function Portrait({ name, cls, size = 56, dead = false, icon }: {
  name: string; cls: ServantClass; size?: number; dead?: boolean; icon?: string;
}) {
  const c = CLASS_COLOR[cls];
  return (
    <div
      className={`portrait ${dead ? 'dead' : ''}`}
      style={{ width: size, height: size, background: `linear-gradient(145deg, ${c}, #0b0f1e 85%)`, fontSize: size * 0.34 }}
      title={name}
    >
      <span>{icon ?? initials(name)}</span>
      <i className="portrait-class">
        <ClassIcon cls={cls} size={Math.max(11, size * 0.3)} color="#fff" title={false} />
      </i>
    </div>
  );
}

export function ClassBadge({ cls }: { cls: ServantClass }) {
  return (
    <span className="class-badge" style={{ borderColor: CLASS_COLOR[cls], color: CLASS_COLOR[cls] }}>
      <ClassIcon cls={cls} size={12} title={false} /> {CLASS_LABEL[cls]}
    </span>
  );
}

export function Bar({ value, max, kind = 'hp', label, thin }: {
  value: number; max: number; kind?: 'hp' | 'np' | 'exp' | 'charge'; label?: ReactNode; thin?: boolean;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const low = kind === 'hp' && pct < 30;
  return (
    <div className={`bar bar-${kind} ${thin ? 'thin' : ''} ${low ? 'low' : ''}`}>
      <div className="bar-fill" style={{ width: `${pct}%` }} />
      {label !== undefined && <span className="bar-label">{label}</span>}
    </div>
  );
}

export function Rarity({ n }: { n: number }) {
  return <span className="rarity">{n === 0 ? '0★' : '★'.repeat(n)}</span>;
}

export function CardTypeTag({ type }: { type: CardType }) {
  return <span className={`card-tag card-${type.toLowerCase()}`}>{type}</span>;
}

export function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: ReactNode; wide?: boolean;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="btn ghost" onClick={onClose} aria-label="Close">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
