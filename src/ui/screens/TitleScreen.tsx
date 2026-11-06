import { useState } from 'react';
import { SERVANTS, USING_ATLAS_DATA } from '@/data/servants';
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
        {hasSave && <button className="btn big gold" onClick={continueRun}>Continue</button>}
        <button className="btn big" onClick={() => {
          if (!hasSave || confirm('Starting a new run will overwrite the current one. Continue?')) startNewRun();
        }}>New run</button>
        <button className="btn ghost" onClick={() => setHelp(true)}>How to play</button>
      </div>
      {meta.runs > 0 && (
        <p className="muted meta">
          Runs: {meta.runs} · Wins: {meta.wins} · Best: {SINGULARITIES[Math.min(meta.bestSingularity, 7)].name}
        </p>
      )}
      <p className="muted small roster">
        {SERVANTS.length} Servants {USING_ATLAS_DATA ? '(Atlas Academy · JP)' : '(fallback roster — run "npm run import:atlas")'}
      </p>
      <p className="disclaimer">Non-profit fan game. Fate/Grand Order © TYPE-MOON / FGO PROJECT. Data: Atlas Academy.</p>
      {help && <Modal title="How to play" onClose={() => setHelp(false)} wide><HelpPanel /></Modal>}
    </div>
  );
}
