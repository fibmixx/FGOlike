import { useEffect, useRef, useState } from 'react';
import { getServant } from '@/data/servants';
import { CHALDEA_UNIFORM } from '@/data/mysticCodes';
import { BUFF_LABEL, CLASS_ICON, classAffinity } from '@/game/constants';
import {
  aliveFront, commandSealHeal, commandSealNp, currentTarget, describeChain, executeTurn,
  npReady, setTarget, skillNeedsAlly, toggleSelect, activateMasterSkill, activateSkill,
} from '@/game/combat/battle';
import { resolveBattle } from '@/game/run';
import type { AllyUnit, BattleState, Buff, EnemyUnit, FxEvent, HandCard, RunState } from '@/game/types';
import { act, battleAct } from '@/store/gameStore';
import { Bar, Portrait } from '../components/common';

type Pending =
  | { type: 'skill'; key: string; idx: number }
  | { type: 'master'; idx: number }
  | { type: 'sealNp' }
  | { type: 'sealHeal' }
  | null;

export function BattleScreen({ run }: { run: RunState }) {
  const b = run.battle!;
  const [pending, setPending] = useState<Pending>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const target = currentTarget(b);
  const chain = describeChain(b);
  const front = b.front;
  const multiAlly = aliveFront(b).length > 1;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [b.log.length]);

  // ─── Acciones ──────────────────────────────────────────
  const onSkill = (a: AllyUnit, idx: number) => {
    if (a.cooldowns[idx] !== 0 || b.status !== 'player') return;
    const sk = getServant(a.defId).skills[idx];
    if (skillNeedsAlly(sk) && multiAlly) setPending({ type: 'skill', key: a.key, idx });
    else battleAct((bs) => { activateSkill(bs, a.key, idx, a.key); });
  };

  const onMaster = (idx: number) => {
    if (b.masterCooldowns[idx] !== 0) return;
    const sk = CHALDEA_UNIFORM.skills[idx];
    if (skillNeedsAlly(sk)) {
      if (multiAlly) setPending({ type: 'master', idx });
      else battleAct((bs) => { activateMasterSkill(bs, idx, aliveFront(bs)[0]?.key); });
    } else battleAct((bs) => { activateMasterSkill(bs, idx); });
  };

  const onAllyClick = (a: AllyUnit) => {
    if (!pending || a.hp <= 0) return;
    const p = pending;
    setPending(null);
    if (p.type === 'skill') battleAct((bs) => { activateSkill(bs, p.key, p.idx, a.key); });
    if (p.type === 'master') battleAct((bs) => { activateMasterSkill(bs, p.idx, a.key); });
    if (p.type === 'sealNp') battleAct((bs, _r, r) => { if (r.commandSeals > 0 && commandSealNp(bs, a.key)) r.commandSeals--; });
    if (p.type === 'sealHeal') battleAct((bs, _r, r) => { if (r.commandSeals > 0 && commandSealHeal(bs, a.key)) r.commandSeals--; });
  };

  const select = (sel: string) => battleAct((bs) => toggleSelect(bs, sel));
  const execute = () => battleAct((bs, rng) => executeTurn(bs, rng));

  // ─── Atajos de teclado ─────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (b.status !== 'player') {
        if (e.key === 'Enter') act(resolveBattle);
        return;
      }
      if (e.key === 'Escape') { setPending(null); return; }
      const n = Number(e.key);
      if (n >= 1 && n <= 5 && b.hand[n - 1]) select(b.hand[n - 1].id);
      const npKey = ['q', 'w', 'e'].indexOf(e.key.toLowerCase());
      if (npKey >= 0 && front[npKey] && npReady(b, front[npKey].key)) select(`np:${front[npKey].key}`);
      if (e.key === 'Backspace' && b.selected.length) select(b.selected[b.selected.length - 1]);
      if (e.key === 'Enter' && b.selected.length === 3) execute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const pendingText =
    pending?.type === 'sealNp' ? 'Hechizo de Comando (NP +100%): elige un Servant'
    : pending?.type === 'sealHeal' ? 'Hechizo de Comando (curación total): elige un Servant'
    : pending ? 'Elige un Servant aliado como objetivo' : null;

  return (
    <div className={`battle battle-${b.kind}`}>
      <div className="battle-top">
        <span>Oleada <b>{b.waveIndex + 1}/{b.waves.length}</b></span>
        <span>Turno <b>{b.turn}</b></span>
        <span className="stars" title="Estrellas críticas para el próximo turno">★ {b.stars}</span>
        {b.kind === 'boss' && <span className="boss-tag">♛ JEFE</span>}
        {b.kind === 'elite' && <span className="boss-tag elite">☠ ÉLITE</span>}
      </div>

      <div className="enemy-row">
        {b.enemies.map((e, i) => (
          <EnemyCard key={e.key} e={e} targeted={target?.key === e.key} fx={b.fx} onClick={() => battleAct((bs) => setTarget(bs, i))} />
        ))}
      </div>

      <div className="battle-log" ref={logRef}>
        {b.log.slice(-30).map((l, i) => <div key={i}>{l}</div>)}
      </div>

      {pendingText && (
        <div className="pending-banner">
          {pendingText} <button className="btn small ghost" onClick={() => setPending(null)}>Cancelar (Esc)</button>
        </div>
      )}

      <div className="ally-row">
        {front.map((a, i) => (
          <AllyPanel key={a.key} a={a} index={i} fx={b.fx} selectable={!!pending && a.hp > 0}
            onClick={() => onAllyClick(a)} onSkill={(idx) => onSkill(a, idx)} />
        ))}
      </div>

      <div className="command-row">
        <div className="np-cards">
          {front.map((a, i) => npReady(b, a.key) && (
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
          <button className="btn big gold" disabled={b.selected.length !== 3 || b.status !== 'player'} onClick={execute}>
            ¡Ataque! ({b.selected.length}/3)
          </button>
        </div>
      </div>

      <div className="master-row">
        <div className="master-skills">
          <span className="muted small">{CHALDEA_UNIFORM.name}</span>
          {CHALDEA_UNIFORM.skills.map((s, i) => (
            <button key={s.id} className="skill-btn master" disabled={b.masterCooldowns[i] !== 0}
              onClick={() => onMaster(i)} title={`${s.name}: ${s.description}`}>
              {b.masterCooldowns[i] > 0 ? b.masterCooldowns[i] : '✧'}
              <small>{s.name}</small>
            </button>
          ))}
        </div>
        <div className="seal-actions">
          <span className="muted small">Hechizos ✠ {run.commandSeals}</span>
          <button className="btn small danger" disabled={run.commandSeals <= 0} onClick={() => setPending({ type: 'sealNp' })}>NP +100%</button>
          <button className="btn small danger" disabled={run.commandSeals <= 0} onClick={() => setPending({ type: 'sealHeal' })}>Curar</button>
        </div>
        <div className="reserve">
          <span className="muted small">Reserva</span>
          {b.back.length === 0 && <span className="muted small">—</span>}
          {b.back.map((a) => <Portrait key={a.key} name={a.name} cls={a.cls} size={30} />)}
        </div>
      </div>

      {b.status !== 'player' && (
        <div className="battle-overlay">
          <div className={`overlay-box ${b.status}`}>
            <h2>{b.status === 'won' ? '¡Victoria!' : 'Derrota'}</h2>
            <p className="muted">{b.status === 'won' ? 'La Singularidad se estabiliza un poco más.' : 'El equipo ha caído. La Orden Humana se desvanece…'}</p>
            <button className="btn big gold" onClick={() => act(resolveBattle)}>Continuar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponentes ──────────────────────────────────────────

function FxLayer({ fx, unitKey }: { fx: FxEvent[]; unitKey: string }) {
  const mine = fx.filter((f) => f.target === unitKey).slice(-6);
  return (
    <div className="fx-layer">
      {mine.map((f, i) => (
        <span key={f.id} className={`fx fx-${f.kind}`} style={{ animationDelay: `${i * 0.12}s` }}>{f.text}</span>
      ))}
    </div>
  );
}

function Buffs({ buffs }: { buffs: Buff[] }) {
  if (!buffs.length) return <div className="buffs" />;
  return (
    <div className="buffs">
      {buffs.map((bf, i) => (
        <span key={i} className={`buff ${['atkDown', 'defDown', 'stun'].includes(bf.kind) ? 'debuff' : ''}`}
          title={`${BUFF_LABEL[bf.kind]} ${bf.value !== 1 ? `${Math.round(bf.value * 100)}%` : ''} · ${bf.turns < 0 ? 'permanente' : `${bf.turns}t`}${bf.times ? ` · ${bf.times} uso(s)` : ''} (${bf.source})`}>
          {BUFF_LABEL[bf.kind]}{bf.turns > 0 ? <sub>{bf.turns}</sub> : null}
        </span>
      ))}
    </div>
  );
}

function EnemyCard({ e, targeted, fx, onClick }: { e: EnemyUnit; targeted: boolean; fx: FxEvent[]; onClick: () => void }) {
  const dead = e.hp <= 0;
  return (
    <div className={`enemy ${targeted ? 'targeted' : ''} ${dead ? 'dead' : ''} ${e.boss ? 'boss' : ''}`} onClick={dead ? undefined : onClick}>
      {targeted && !dead && <div className="target-mark">▼</div>}
      <FxLayer fx={fx} unitKey={e.key} />
      <Portrait name={e.name} cls={e.cls} size={e.boss ? 84 : 64} icon={e.icon} dead={dead} />
      <div className="enemy-name">{e.name}</div>
      <div className="muted small">{CLASS_ICON[e.cls]} {e.cls} · Nv. {e.level}</div>
      <Bar value={e.hp} max={e.maxHp} label={`${Math.max(0, e.hp)}`} />
      <div className="charge" title={`Carga: ${e.charge}/${e.chargeMax} → ${e.npName}`}>
        {Array.from({ length: e.chargeMax }, (_, i) => <i key={i} className={i < e.charge ? 'on' : ''}>◆</i>)}
        {e.actions > 1 && <small className="muted"> ×{e.actions} acciones</small>}
      </div>
      <Buffs buffs={e.buffs} />
    </div>
  );
}

function AllyPanel({ a, index, fx, selectable, onClick, onSkill }: {
  a: AllyUnit; index: number; fx: FxEvent[]; selectable: boolean; onClick: () => void; onSkill: (i: number) => void;
}) {
  const def = getServant(a.defId);
  const dead = a.hp <= 0;
  return (
    <div className={`ally ${dead ? 'dead' : ''} ${selectable ? 'selectable' : ''}`} onClick={onClick}>
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
        {def.skills.map((s, i) => {
          const cd = a.cooldowns[i];
          const locked = cd === null;
          return (
            <button key={s.id} className={`skill-btn ${locked ? 'locked' : ''}`} disabled={dead || cd !== 0}
              onClick={(ev) => { ev.stopPropagation(); onSkill(i); }}
              title={locked ? `🔒 ${s.name} — se desbloquea con la Ascensión ${i}` : `${s.name} (CD ${s.cooldown}): ${s.description}`}>
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
  const owner = b.front.find((a) => a.key === c.owner)!;
  const aff = target ? classAffinity(owner.cls, target.cls) : 1;
  return (
    <button className={`cmd-card card-${c.type.toLowerCase()} ${order >= 0 ? 'selected' : ''}`} onClick={onClick}>
      {order >= 0 && <span className="order">{order + 1}</span>}
      <Portrait name={owner.name} cls={owner.cls} size={44} />
      <span className="cmd-type">{c.type}</span>
      {aff > 1 && <span className="aff up" title="Ventaja de clase">▲</span>}
      {aff < 1 && <span className="aff down" title="Desventaja de clase">▼</span>}
      {c.stars > 0 && <span className="crit">{c.stars * 10}%</span>}
      <span className="hotkey">{hotkey}</span>
    </button>
  );
}

function NpCard({ a, hotkey, order, onClick }: { a: AllyUnit; hotkey: string; order: number; onClick: () => void }) {
  const np = getServant(a.defId).np;
  return (
    <button className={`cmd-card np-card card-${np.card.toLowerCase()} ${order >= 0 ? 'selected' : ''}`} onClick={onClick}
      title={`${np.name}: ${np.description}`}>
      {order >= 0 && <span className="order">{order + 1}</span>}
      <span className="np-name">{np.name}</span>
      <span className="cmd-type">NP {Math.floor(a.np)}%</span>
      <span className="hotkey">{hotkey}</span>
    </button>
  );
}
