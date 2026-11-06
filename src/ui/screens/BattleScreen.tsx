import { useEffect, useRef, useState } from 'react';
import { CHALDEA_UNIFORM } from '@/data/mysticCodes';
import { BUFF_LABEL, CLASS_LABEL, classAffinity } from '@/game/constants';
import { describeEffects, describeNp } from '@/game/effects';
import {
  activateSkill, aliveFront, beginTurn, commandSealHeal, commandSealNp, currentTarget, describeChain,
  finishTurn, nextStepDelay, npReady, setTarget, skillNeedsAlly, stepTurn, toggleSelect,
} from '@/game/combat/battle';
import { resolveBattle, useMysticCode } from '@/game/run';
import type { AllyUnit, BattleState, Buff, ChainCard, EnemyUnit, FxEvent, HandCard, RunState } from '@/game/types';
import { act, battleAct, setSpeed, useGame } from '@/store/gameStore';
import { ClassIcon } from '../components/ClassIcon';
import { Bar, Portrait } from '../components/common';

type Pending =
  | { type: 'skill'; key: string; idx: number }
  | { type: 'master'; idx: number }
  | { type: 'sealNp' }
  | { type: 'sealHeal' }
  | null;

export function BattleScreen({ run }: { run: RunState }) {
  const b = run.battle!;
  const { speed } = useGame();
  const [pending, setPending] = useState<Pending>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const target = currentTarget(b);
  const chain = describeChain(b);
  const resolving = b.phase === 'resolving';
  const canAct = b.status === 'player' && !resolving;
  const multiAlly = aliveFront(b).length > 1;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [b.log.length]);

  // ─── Step-by-step turn playback ──────────────────────────
  useEffect(() => {
    if (!resolving) return;
    const id = setTimeout(() => battleAct((bs, rng) => { stepTurn(bs, rng); }), nextStepDelay(b) / speed);
    return () => clearTimeout(id);
  }, [b, resolving, speed]);

  // ─── Actions ─────────────────────────────────────────────
  const onSkill = (a: AllyUnit, idx: number) => {
    if (a.cooldowns[idx] !== 0 || !canAct) return;
    if (skillNeedsAlly(a.skills[idx]) && multiAlly) setPending({ type: 'skill', key: a.key, idx });
    else battleAct((bs, rng) => { activateSkill(bs, rng, a.key, idx, a.key); });
  };

  const onMaster = (idx: number) => {
    if (run.mysticUsed[idx] || !canAct) return;
    if (skillNeedsAlly(CHALDEA_UNIFORM.skills[idx]) && multiAlly) setPending({ type: 'master', idx });
    else act((r) => { useMysticCode(r, idx, aliveFront(r.battle!)[0]?.key); });
  };

  const onAllyClick = (a: AllyUnit) => {
    if (!pending || a.hp <= 0) return;
    const p = pending;
    setPending(null);
    if (p.type === 'skill') battleAct((bs, rng) => { activateSkill(bs, rng, p.key, p.idx, a.key); });
    if (p.type === 'master') act((r) => { useMysticCode(r, p.idx, a.key); });
    if (p.type === 'sealNp') battleAct((bs, _r, r) => { if (r.commandSeals > 0 && commandSealNp(bs, a.key)) r.commandSeals--; });
    if (p.type === 'sealHeal') battleAct((bs, _r, r) => { if (r.commandSeals > 0 && commandSealHeal(bs, a.key)) r.commandSeals--; });
  };

  const select = (sel: string) => battleAct((bs) => toggleSelect(bs, sel));
  const attack = () => battleAct((bs) => { beginTurn(bs); });
  const skip = () => battleAct((bs, rng) => finishTurn(bs, rng));

  // ─── Keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (b.status !== 'player') {
        if (e.key === 'Enter') act(resolveBattle);
        return;
      }
      if (resolving) {
        if (e.key === ' ' || e.key === 'Escape') { e.preventDefault(); skip(); }
        return;
      }
      if (e.key === 'Escape') { setPending(null); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= 5 && b.hand[n - 1]) select(b.hand[n - 1].id);
      const npKey = ['q', 'w', 'e'].indexOf(e.key.toLowerCase());
      if (npKey >= 0 && b.front[npKey] && npReady(b, b.front[npKey].key)) select(`np:${b.front[npKey].key}`);
      if (e.key === 'Backspace' && b.selected.length) select(b.selected[b.selected.length - 1]);
      if (e.key === 'Enter' && b.selected.length === 3) attack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pendingText =
    pending?.type === 'sealNp' ? 'Command Seal (NP +100%): choose a Servant'
    : pending?.type === 'sealHeal' ? 'Command Seal (full heal): choose a Servant'
    : pending ? 'Choose an allied Servant as the target' : null;

  return (
    <div className={`battle battle-${b.kind} ${resolving ? 'is-resolving' : ''}`}>
      <div className="battle-top">
        <span>Wave <b>{b.waveIndex + 1}/{b.waves.length}</b></span>
        <span>Turn <b>{b.turn}</b></span>
        <span className="stars" title="Critical stars for the next turn">★ {b.stars}</span>
        <span className="speed">
          {([1, 2, 4] as const).map((v) => (
            <button key={v} className={`btn small ${speed === v ? 'gold' : 'ghost'}`} onClick={() => setSpeed(v)}>{v}×</button>
          ))}
        </span>
        {b.kind === 'boss' && <span className="boss-tag">♛ BOSS</span>}
        {b.kind === 'elite' && <span className="boss-tag elite">☠ ELITE</span>}
      </div>

      <div className="enemy-row">
        {b.enemies.map((e, i) => (
          <EnemyCard key={e.key} e={e} targeted={target?.key === e.key} acting={b.acting === e.key} fx={b.fx}
            onClick={() => canAct && battleAct((bs) => setTarget(bs, i))} />
        ))}
      </div>

      <div className="battle-log" ref={logRef}>
        {b.log.slice(-30).map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {pendingText && (
        <div className="pending-banner">
          {pendingText} <button className="btn small ghost" onClick={() => setPending(null)}>Cancel (Esc)</button>
        </div>
      )}

      <div className="ally-row">
        {b.front.map((a, i) => (
          <AllyPanel key={a.key} a={a} index={i} fx={b.fx} acting={b.acting === a.key} selectable={!!pending && a.hp > 0}
            disabled={!canAct} onClick={() => onAllyClick(a)} onSkill={(idx) => onSkill(a, idx)} />
        ))}
      </div>

      {resolving && b.chain ? (
        <div className="command-row resolving">
          <ChainStrip b={b} cards={b.chain.cards} />
          <div className="execute">
            <button className="btn" onClick={skip}>Skip ⏭ <small>(Space)</small></button>
          </div>
        </div>
      ) : (
        <div className="command-row">
          <div className="np-cards">
            {b.front.map((a, i) => npReady(b, a.key) && (
              <NpCard key={a.key} a={a} hotkey={['Q', 'W', 'E'][i]} order={b.selected.indexOf(`np:${a.key}`)} onClick={() => select(`np:${a.key}`)} />
            ))}
          </div>
          <div className="hand">
            {b.hand.map((c, i) => (
              <CommandCard key={c.id} c={c} b={b} hotkey={i + 1} target={target}
                order={b.selected.indexOf(c.id)} onClick={() => select(c.id)} />
            ))}
          </div>
          <div className="execute">
            <div className="chain-preview">
              {chain.label && <span className="chain">{chain.label}</span>}
              {chain.brave && <span className="chain brave">Brave Chain</span>}
            </div>
            <button className="btn big gold" disabled={b.selected.length !== 3 || !canAct} onClick={attack}>
              Attack! ({b.selected.length}/3)
            </button>
          </div>
        </div>
      )}

      <div className="master-row">
        <div className="master-skills">
          <span className="muted small">{CHALDEA_UNIFORM.name}<br /><small>once per Singularity</small></span>
          {CHALDEA_UNIFORM.skills.map((s, i) => (
            <button key={s.id} className={`skill-btn master ${run.mysticUsed[i] ? 'used' : ''}`} disabled={run.mysticUsed[i] || !canAct}
              onClick={() => onMaster(i)} title={`${s.name}: ${describeEffects(s.effects).join('. ')}${run.mysticUsed[i] ? ' (used)' : ''}`}>
              {run.mysticUsed[i] ? '✕' : '✧'}
              <small>{s.name}</small>
            </button>
          ))}
        </div>
        <div className="seal-actions">
          <span className="muted small">Command Seals ✠ {run.commandSeals}</span>
          <button className="btn small danger" disabled={run.commandSeals <= 0 || !canAct} onClick={() => setPending({ type: 'sealNp' })}>NP +100%</button>
          <button className="btn small danger" disabled={run.commandSeals <= 0 || !canAct} onClick={() => setPending({ type: 'sealHeal' })}>Full heal</button>
        </div>
        <div className="reserve">
          <span className="muted small">Reserve</span>
          {b.back.length === 0 && <span className="muted small">—</span>}
          {b.back.map((a) => <Portrait key={a.key} name={a.name} cls={a.cls} size={30} />)}
        </div>
      </div>

      {b.banner && <div className="cut-in" key={b.banner + b.fxCounter}><span>{b.banner}</span></div>}

      {b.status !== 'player' && (
        <div className="battle-overlay">
          <div className={`overlay-box ${b.status}`}>
            <h2>{b.status === 'won' ? 'Victory!' : 'Defeat'}</h2>
            <p className="muted">{b.status === 'won' ? 'The Singularity grows a little more stable.' : 'Your party has fallen. Human Order fades away…'}</p>
            <button className="btn big gold" onClick={() => act(resolveBattle)}>Continue</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────

function FxLayer({ fx, unitKey }: { fx: FxEvent[]; unitKey: string }) {
  const mine = fx.filter((f) => f.target === unitKey).slice(-6);
  return (
    <div className="fx-layer">
      {mine.map((f, i) => (
        <span key={f.id} className={`fx fx-${f.kind}`} style={{ animationDelay: `${i * 0.1}s` }}>{f.text}</span>
      ))}
    </div>
  );
}

const isHit = (fx: FxEvent[], key: string) => fx.some((f) => f.target === key && (f.kind === 'damage' || f.kind === 'crit'));

function Buffs({ buffs }: { buffs: Buff[] }) {
  if (!buffs.length) return <div className="buffs" />;
  return (
    <div className="buffs">
      {buffs.map((bf, i) => (
        <span key={i} className={`buff ${['atkDown', 'defDown', 'stun', 'dot'].includes(bf.kind) ? 'debuff' : ''}`}
          title={`${BUFF_LABEL[bf.kind]} ${bf.value !== 1 ? (bf.value < 5 ? `${Math.round(bf.value * 100)}%` : bf.value) : ''} · ${bf.turns < 0 ? 'permanent' : `${bf.turns}T`}${bf.times ? ` · ${bf.times}×` : ''} (${bf.source})`}>
          {BUFF_LABEL[bf.kind]}{bf.turns > 0 ? <sub>{bf.turns}</sub> : null}
        </span>
      ))}
    </div>
  );
}

function EnemyCard({ e, targeted, acting, fx, onClick }: {
  e: EnemyUnit; targeted: boolean; acting: boolean; fx: FxEvent[]; onClick: () => void;
}) {
  const dead = e.hp <= 0;
  const barsLeft = e.phases.length + 1;
  return (
    <div className={`enemy ${targeted ? 'targeted' : ''} ${dead ? 'dead' : ''} ${e.boss ? 'boss' : ''} ${acting ? 'acting' : ''} ${isHit(fx, e.key) ? 'hit' : ''}`}
      onClick={dead ? undefined : onClick}>
      {targeted && !dead && <div className="target-mark">▼</div>}
      <FxLayer fx={fx} unitKey={e.key} />
      <Portrait name={e.name} cls={e.cls} size={e.boss ? 84 : 64} icon={e.icon} dead={dead} />
      <div className="enemy-name">{e.name}</div>
      <div className="muted small"><ClassIcon cls={e.cls} size={12} /> {CLASS_LABEL[e.cls]} · Lv. {e.level}</div>
      {e.totalBars > 1 && (
        <div className="hp-bars" title={`${barsLeft} HP bar(s) left`}>
          {Array.from({ length: e.totalBars }, (_, i) => <i key={i} className={i < barsLeft ? 'on' : ''} />)}
        </div>
      )}
      <Bar value={e.hp} max={e.maxHp} label={`${Math.max(0, e.hp)}`} />
      <div className="charge" title={`Charge ${e.charge}/${e.chargeMax} → ${e.npName}`}>
        {Array.from({ length: e.chargeMax }, (_, i) => <i key={i} className={i < e.charge ? 'on' : ''}>◆</i>)}
        {e.actions > 1 && <small className="muted"> ×{e.actions} actions</small>}
      </div>
      <Buffs buffs={e.buffs} />
    </div>
  );
}

function AllyPanel({ a, index, fx, acting, selectable, disabled, onClick, onSkill }: {
  a: AllyUnit; index: number; fx: FxEvent[]; acting: boolean; selectable: boolean; disabled: boolean;
  onClick: () => void; onSkill: (i: number) => void;
}) {
  const dead = a.hp <= 0;
  return (
    <div className={`ally ${dead ? 'dead' : ''} ${selectable ? 'selectable' : ''} ${acting ? 'acting' : ''} ${isHit(fx, a.key) ? 'hit' : ''}`} onClick={onClick}>
      <FxLayer fx={fx} unitKey={a.key} />
      <div className="ally-head">
        <Portrait name={a.name} cls={a.cls} size={52} dead={dead} />
        <div className="grow">
          <div className="ally-name">{a.name}</div>
          <Bar value={a.hp} max={a.maxHp} label={`${Math.max(0, a.hp)}/${a.maxHp}`} />
          <Bar value={Math.min(100, a.np)} max={100} kind="np" thin label={`NP ${Math.floor(a.np)}%`} />
        </div>
      </div>
      <div className="skills">
        {a.skills.map((s, i) => {
          const cd = a.cooldowns[i];
          const locked = cd === null;
          return (
            <button key={s.id + i} className={`skill-btn ${locked ? 'locked' : ''}`} disabled={dead || cd !== 0 || disabled}
              onClick={(ev) => { ev.stopPropagation(); onSkill(i); }}
              title={locked ? `🔒 ${s.name} — unlocks at Ascension ${i}` : `${s.name} (CD ${s.cooldown})\n${describeEffects(s.effects).join('\n')}`}>
              {locked ? '🔒' : cd! > 0 ? cd : '◆'}
              <small>{s.name}</small>
            </button>
          );
        })}
      </div>
      <Buffs buffs={a.buffs} />
      <span className="slot-key">{['Q', 'W', 'E'][index]}</span>
    </div>
  );
}

function CommandCard({ c, b, hotkey, order, onClick, target }: {
  c: HandCard; b: BattleState; hotkey: number; order: number; onClick: () => void; target?: EnemyUnit;
}) {
  const owner = b.front.find((a) => a.key === c.owner);
  if (!owner) return null;
  const aff = target ? classAffinity(owner.cls, target.cls) : 1;
  return (
    <button className={`cmd-card card-${c.type.toLowerCase()} ${order >= 0 ? 'selected' : ''}`} onClick={onClick}>
      {order >= 0 && <span className="order">{order + 1}</span>}
      <Portrait name={owner.name} cls={owner.cls} size={44} />
      <span className="cmd-type">{c.type}</span>
      {aff > 1 && <span className="aff up" title="Class advantage">▲</span>}
      {aff < 1 && <span className="aff down" title="Class disadvantage">▼</span>}
      {c.stars > 0 && <span className="crit">{c.stars * 10}%</span>}
      <span className="hotkey">{hotkey}</span>
    </button>
  );
}

function NpCard({ a, hotkey, order, onClick }: { a: AllyUnit; hotkey: string; order: number; onClick: () => void }) {
  const np = a.npDef;
  return (
    <button className={`cmd-card np-card card-${np.card.toLowerCase()} ${order >= 0 ? 'selected' : ''}`} onClick={onClick}
      title={`${np.name}\n${describeNp(np).join('\n')}`}>
      {order >= 0 && <span className="order">{order + 1}</span>}
      <span className="np-name">{np.name}</span>
      <span className="cmd-type">NP {Math.floor(a.np)}%</span>
      <span className="hotkey">{hotkey}</span>
    </button>
  );
}

function ChainStrip({ b, cards }: { b: BattleState; cards: ChainCard[] }) {
  const brave = !!b.chain?.braveOwner;
  return (
    <div className="hand chain-strip">
      {cards.map((c, i) => {
        const owner = b.front.find((a) => a.key === c.owner) ?? b.fallen.find((a) => a.key === c.owner);
        const done = b.actingCard !== null ? i < b.actingCard : !b.queue.some((q) => q.t === 'card' && q.i === i);
        return (
          <div key={i} className={`cmd-card card-${c.type.toLowerCase()} ${c.isNp ? 'np-card' : ''} ${b.actingCard === i ? 'active' : ''} ${done ? 'done' : ''}`}>
            <span className="order">{i + 1}</span>
            {owner && <Portrait name={owner.name} cls={owner.cls} size={40} />}
            <span className="cmd-type">{c.isNp ? 'NP' : c.type}</span>
          </div>
        );
      })}
      {brave && (
        <div className={`cmd-card card-extra ${b.actingCard === 3 ? 'active' : ''}`}>
          <span className="cmd-type">EXTRA</span>
        </div>
      )}
    </div>
  );
}
