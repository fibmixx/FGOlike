import { useState } from 'react';
import { SINGULARITIES } from '@/data/singularities';
import { continueRun, startNewRun, useGame } from '@/store/gameStore';
import { HelpPanel } from '../components/HelpPanel';
import { Modal } from '../components/common';

export function TitleScreen() {
  const { hasSave, meta } = useGame();
  const [help, setHelp] = useState(false);
  return (
    <div className="title-screen">
      <div className="title-glow" />
      <h1 className="logo">FGO<span>like</span></h1>
      <p className="tagline">Grand Order · Roguelike</p>
      <div className="title-buttons">
        {hasSave && <button className="btn big gold" onClick={continueRun}>Continuar partida</button>}
        <button className="btn big" onClick={() => {
          if (!hasSave || confirm('Empezar una nueva partida sobrescribirá la actual. ¿Continuar?')) startNewRun();
        }}>Nueva partida</button>
        <button className="btn ghost" onClick={() => setHelp(true)}>Cómo jugar</button>
      </div>
      {meta.runs > 0 && (
        <p className="muted meta">
          Partidas: {meta.runs} · Victorias: {meta.wins} · Mejor progreso: {SINGULARITIES[Math.min(meta.bestSingularity, 7)].name}
        </p>
      )}
      <p className="disclaimer">Fan game sin ánimo de lucro. Fate/Grand Order © TYPE-MOON / FGO PROJECT.</p>
      {help && <Modal title="Cómo jugar" onClose={() => setHelp(false)} wide><HelpPanel /></Modal>}
    </div>
  );
}
