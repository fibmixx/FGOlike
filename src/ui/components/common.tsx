import type { ReactNode } from 'react';
import { CLASS_ICON } from '@/game/constants';
import type { CardType, ServantClass } from '@/game/types';

const CLASS_COLOR: Record<ServantClass, string> = {
  Saber: '#4d7cff', Archer: '#e0473f', Lancer: '#3ab0a2', Rider: '#d9a72b', Caster: '#9b5de5',
  Assassin: '#5b5b6e', Berserker: '#c2185b', Shielder: '#8aa0b8', Ruler: '#f2d16b', Avenger: '#7a1f1f',
};

function initials(name: string) {
  return name.replace(/\(.*?\)/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

/** Retrato placeholder: gradiente por clase + iniciales. Sustituible por arte propio en /public/portraits/<id>.png */
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
      <i className="portrait-class" style={{ fontSize: Math.max(10, size * 0.22) }}>{CLASS_ICON[cls]}</i>
    </div>
  );
}

export function ClassBadge({ cls }: { cls: ServantClass }) {
  return <span className="class-badge" style={{ borderColor: CLASS_COLOR[cls], color: CLASS_COLOR[cls] }}>{CLASS_ICON[cls]} {cls}</span>;
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
  return <span className="rarity">{'★'.repeat(n)}</span>;
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
          <button className="btn ghost" onClick={onClose} aria-label="Cerrar">✕</button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
