// Original class glyphs for FGOlike (not FGO assets). 24×24 grid, drawn with currentColor.
import { CLASS_COLOR, CLASS_LABEL } from '@/game/constants';
import type { ServantClass } from '@/game/types';
import type { JSX } from 'react';

const G: Record<ServantClass, JSX.Element> = {
  // upright sword
  Saber: (
    <>
      <path d="M12 2 L14 5 L14 15 L10 15 L10 5 Z" />
      <rect x="6.5" y="15" width="11" height="2" rx="1" />
      <rect x="11" y="17" width="2" height="4" />
      <circle cx="12" cy="22" r="1.4" />
    </>
  ),
  // bow and arrow
  Archer: (
    <>
      <path d="M7 3 C17 7 17 17 7 21" fill="none" strokeWidth="2.2" stroke="currentColor" />
      <path d="M7 3 L7 21" fill="none" strokeWidth="0.9" stroke="currentColor" />
      <path d="M4 12 H19" strokeWidth="1.6" stroke="currentColor" />
      <path d="M22 12 L17.5 9.5 L17.5 14.5 Z" />
      <path d="M4 12 L2.5 10 M4 12 L2.5 14" strokeWidth="1.2" stroke="currentColor" fill="none" />
    </>
  ),
  // spear
  Lancer: (
    <>
      <path d="M12 1.5 L15 7 L12 9.5 L9 7 Z" />
      <rect x="10.8" y="9" width="2.4" height="13.5" rx="1.2" />
      <path d="M9 10.5 H15" strokeWidth="1.6" stroke="currentColor" />
    </>
  ),
  // chariot wheel
  Rider: (
    <>
      <circle cx="12" cy="12" r="9" fill="none" strokeWidth="2.2" stroke="currentColor" />
      <circle cx="12" cy="12" r="2.4" />
      {[0, 45, 90, 135].map((a) => (
        <path key={a} d="M12 3.5 V20.5" strokeWidth="1.4" stroke="currentColor" transform={`rotate(${a} 12 12)`} />
      ))}
    </>
  ),
  // four-point star in an orbit
  Caster: (
    <>
      <path d="M12 2 L13.8 10.2 L22 12 L13.8 13.8 L12 22 L10.2 13.8 L2 12 L10.2 10.2 Z" />
      <ellipse cx="12" cy="12" rx="9.5" ry="4" fill="none" strokeWidth="1.1" stroke="currentColor" transform="rotate(-30 12 12)" />
    </>
  ),
  // descending dagger
  Assassin: (
    <>
      <path d="M12 22.5 L9.6 12 L14.4 12 Z" />
      <rect x="7.5" y="10" width="9" height="2" rx="1" />
      <rect x="11" y="4.5" width="2" height="5.5" />
      <path d="M12 1.5 L14 4.5 H10 Z" />
    </>
  ),
  // three claw slashes
  Berserker: (
    <>
      {[-5, 0, 5].map((dx) => (
        <path key={dx} d={`M${10 + dx} 3 L${15.5 + dx} 21 L${13 + dx} 21 L${7.8 + dx} 4.8 Z`} transform={`rotate(-12 ${12 + dx} 12)`} />
      ))}
    </>
  ),
  // heater shield with a cross
  Shielder: (
    <>
      <path d="M12 2 L20 5 V11 C20 16.5 16.5 20 12 22 C7.5 20 4 16.5 4 11 V5 Z" fill="none" strokeWidth="2" stroke="currentColor" />
      <path d="M12 6.5 V17.5 M7.5 10.5 H16.5" strokeWidth="2.2" stroke="currentColor" />
    </>
  ),
  // balance scales
  Ruler: (
    <>
      <rect x="11.1" y="3" width="1.8" height="17" />
      <rect x="8" y="20" width="8" height="2" rx="1" />
      <path d="M4 6.5 H20" strokeWidth="1.6" stroke="currentColor" />
      <circle cx="12" cy="3" r="1.6" />
      <path d="M4 6.5 L1.5 13 H6.5 Z M20 6.5 L17.5 13 H22.5 Z" fill="none" strokeWidth="1.1" stroke="currentColor" />
      <path d="M1.5 13 Q4 16 6.5 13 Z M17.5 13 Q20 16 22.5 13 Z" />
    </>
  ),
  // black flame
  Avenger: (
    <path d="M12 2 C13 6 18 8 18 14 C18 18.5 15.3 22 12 22 C8.7 22 6 18.5 6 14.5 C6 11.5 7.6 9.8 9 8.6 C9 11 10 12.4 11.2 12.8 C10.4 9 11.6 5.4 12 2 Z" />
  ),
  // split mask
  AlterEgo: (
    <>
      <path d="M12 3 C7 3 3.5 6 3.5 11 C3.5 16.5 7.5 21 12 21 Z" />
      <path d="M12 3 C17 3 20.5 6 20.5 11 C20.5 16.5 16.5 21 12 21 Z" fill="none" strokeWidth="1.6" stroke="currentColor" />
      <ellipse cx="8" cy="10" rx="1.8" ry="1.1" fill="#0b0f1e" />
      <ellipse cx="16" cy="10" rx="1.8" ry="1.1" />
    </>
  ),
  // crescent moon and a small planet
  MoonCancer: (
    <>
      <path d="M15 2.5 A9.5 9.5 0 1 0 21.5 17 A7.5 7.5 0 1 1 15 2.5 Z" />
      <circle cx="18" cy="7" r="1.6" />
    </>
  ),
  // cosmic eye with rays
  Foreigner: (
    <>
      <path d="M2 12 C6 6 18 6 22 12 C18 18 6 18 2 12 Z" fill="none" strokeWidth="1.8" stroke="currentColor" />
      <circle cx="12" cy="12" r="3.2" />
      {[-60, -30, 0, 30, 60].map((a) => (
        <path key={a} d="M12 4.5 V1.5" strokeWidth="1.3" stroke="currentColor" transform={`rotate(${a} 12 12)`} />
      ))}
      <path d="M8 18.5 Q7 21 5 21.5 M16 18.5 Q17 21 19 21.5 M12 18.5 V22" strokeWidth="1.2" stroke="currentColor" fill="none" />
    </>
  ),
  // crowned theatre mask
  Pretender: (
    <>
      <path d="M5 6 L8 9 L12 4.5 L16 9 L19 6 L18.2 11 H5.8 Z" />
      <path d="M5.5 12 H18.5 C18.5 17.5 15.5 21 12 21 C8.5 21 5.5 17.5 5.5 12 Z" fill="none" strokeWidth="1.7" stroke="currentColor" />
      <path d="M8.3 15 Q9.3 14 10.3 15 M13.7 15 Q14.7 14 15.7 15" strokeWidth="1.3" stroke="currentColor" fill="none" />
    </>
  ),
  // horns
  Beast: (
    <>
      <path d="M9.5 15 C5 14 2 10 3 3 C5 8 8 10 11 11 Z" />
      <path d="M14.5 15 C19 14 22 10 21 3 C19 8 16 10 13 11 Z" />
      <circle cx="12" cy="17.5" r="3.3" />
      <circle cx="12" cy="17.5" r="1.1" fill="#0b0f1e" />
    </>
  ),
};

export function ClassIcon({ cls, size = 18, color, title = true }: {
  cls: ServantClass; size?: number; color?: string; title?: boolean;
}) {
  return (
    <svg
      className="class-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ color: color ?? CLASS_COLOR[cls], flexShrink: 0 }}
      role="img"
      aria-label={CLASS_LABEL[cls]}
    >
      {title && <title>{CLASS_LABEL[cls]}</title>}
      {G[cls]}
    </svg>
  );
}
