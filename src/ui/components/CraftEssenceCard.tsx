import { getCraftEssence } from '@/data/craftEssences';
import { Rarity } from './common';

export function CraftEssenceCard({ defId, compact = false }: { defId: string; compact?: boolean }) {
  const ce = getCraftEssence(defId);
  return (
    <div className={`ce-card rarity-${ce.rarity} ${compact ? 'compact' : ''}`}>
      <div className="ce-art"><span>✧</span></div>
      <div className="ce-info">
        <div className="ce-name">{ce.name} <Rarity n={ce.rarity} /></div>
        <div className="ce-text">{ce.text}</div>
        {!compact && (
          <div className="muted small">
            {ce.atk > 0 && `ATK +${ce.atk}`}{ce.atk > 0 && ce.hp > 0 && ' · '}{ce.hp > 0 && `HP +${ce.hp}`} <span>(at Lv.90)</span>
          </div>
        )}
      </div>
    </div>
  );
}
