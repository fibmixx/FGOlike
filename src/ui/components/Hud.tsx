import { useState } from 'react';
import { SINGULARITIES } from '@/data/singularities';
import { abandonRun, toTitle } from '@/store/gameStore';
import type { RunState } from '@/game/types';
import { Modal } from './common';
import { PartyPanel } from './PartyPanel';
import { HelpPanel } from './HelpPanel';

export function Hud({ run }: { run: RunState }) {
  const [open, setOpen] = useState<'party' | 'help' | 'menu' | null>(null);
  const sing = SINGULARITIES[run.singularity];
  const inBattle = run.phase === 'battle';

  return (
    <>
      <header className="hud" style={{ ['--accent' as string]: sing.theme.accent }}>
        <div className="hud-title">
          <span className="hud-code">{sing.code}</span>
          <div>
            <div className="hud-name">{sing.name}</div>
            <div className="hud-sub">{sing.era}</div>
          </div>
        </div>
        <div className="hud-stats">
          <span title="Ascension Crystals">◆ {run.crystals}</span>
          <span title="Craft Essences">✧ {run.ces.length}</span>
          <span title="Command Seals (they do not regenerate)" className="seals">
            {Array.from({ length: 3 }, (_, i) => <i key={i} className={i < run.commandSeals ? 'on' : ''}>✠</i>)}
          </span>
        </div>
        <nav className="hud-actions">
          <button className={`btn ${run.crystals > 0 && !inBattle ? 'glow' : ''}`} onClick={() => setOpen('party')}>
            Party ({run.party.length}/6)
          </button>
          <button className="btn ghost" onClick={() => setOpen('help')}>?</button>
          <button className="btn ghost" onClick={() => setOpen('menu')}>☰</button>
        </nav>
      </header>

      {open === 'party' && (
        <Modal title="Servants" onClose={() => setOpen(null)} wide>
          <PartyPanel run={run} />
        </Modal>
      )}
      {open === 'help' && (
        <Modal title="How to play" onClose={() => setOpen(null)} wide>
          <HelpPanel />
        </Modal>
      )}
      {open === 'menu' && (
        <Modal title="Menu" onClose={() => setOpen(null)}>
          <div className="stack">
            <p className="muted">Your run is saved automatically.</p>
            <button className="btn" onClick={toTitle}>Back to title</button>
            <button className="btn danger" onClick={() => { if (confirm('Abandon this run? All progress will be lost.')) abandonRun(); }}>
              Abandon run
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
