import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { isMuted, setMuted, sfx } from '../sfx';
import './arena.css';

/** Crowd silhouettes, camera flashes, spotlights and ring ropes. */
export const Arena = memo(function Arena({ ropes = true, table = false }: { ropes?: boolean; table?: boolean }) {
  const crowd = useMemo(() => {
    let s = '';
    for (let row = 0; row < 5; row++)
      for (let i = 0; i < 90; i++) {
        const cx = i * 22 + (row % 2) * 11 + ((i * 37 + row * 13) % 7);
        const cy = 18 + row * 22 + ((i * 11) % 5);
        const o = 0.62 - row * 0.08;
        s += `<circle cx="${cx}" cy="${cy}" r="${8 + (i % 3)}" fill="#000" fill-opacity="${o}"/><rect x="${cx - 12}" y="${cy + 6}" width="24" height="20" rx="10" fill="#000" fill-opacity="${o}"/>`;
      }
    return `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1980" height="140">${s}</svg>`)}`;
  }, []);
  const flashes = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({ left: (i * 157) % 100, top: 6 + ((i * 71) % 14), delay: (i * 0.73) % 6, dur: 3 + (i % 5) })),
    [],
  );
  return (
    <div className="arena" aria-hidden>
      <div className="arena-glow" />
      <div className="arena-crowd" style={{ backgroundImage: `url("${crowd}")` }} />
      {flashes.map((f, i) => (
        <span key={i} className="arena-flash" style={{ left: `${f.left}%`, top: `${f.top}%`, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }} />
      ))}
      <div className="arena-spot s1" />
      <div className="arena-spot s2" />
      <div className="arena-spot s3" />
      {ropes && !table && (
        <div className="arena-ropes">
          <i style={{ background: '#e8102e' }} />
          <i style={{ background: '#fff' }} />
          <i style={{ background: '#2457e6' }} />
        </div>
      )}
      {table && <div className="arena-table" />}
      <div className="arena-vignette" />
    </div>
  );
});

export function HpBar({ hp, max = 100, align = 'left' }: { hp: number; max?: number; align?: 'left' | 'right' }) {
  const pct = Math.max(0, Math.min(100, (hp / max) * 100));
  const fill = pct > 50 ? 'var(--hp-hi)' : pct > 25 ? 'var(--hp-lo)' : 'var(--hp-crit)';
  return (
    <div className={`hpbar ${pct <= 25 ? 'crit' : ''}`}>
      <motion.div
        className="hpbar-ghost"
        style={{ [align]: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
      />
      <motion.div className="hpbar-fill" style={{ [align]: 0, background: fill }} animate={{ width: `${pct}%` }} transition={{ duration: 0.25 }} />
    </div>
  );
}

export function Pips({ value, max = 3, small }: { value: number; max?: number; small?: boolean }) {
  return (
    <div className={`pips ${small ? 'small' : ''}`}>
      {Array.from({ length: max }, (_, i) => (
        <motion.i
          key={i}
          className={i < value ? 'on' : ''}
          animate={i < value ? { scale: [1, 1.5, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
        />
      ))}
    </div>
  );
}

export function MuteButton() {
  const [m, setM] = useState(isMuted());
  return (
    <button
      className="icon-btn"
      aria-label={m ? 'Unmute' : 'Mute'}
      onClick={() => {
        setMuted(!m);
        setM(!m);
        if (m) sfx.click();
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
        <path d="M11 5 6 9H2v6h4l5 4z" fill="#fff" />
        {m ? (
          <>
            <path d="m22 9-6 6" />
            <path d="m16 9 6 6" />
          </>
        ) : (
          <>
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 5a10 10 0 0 1 0 14" />
          </>
        )}
      </svg>
    </button>
  );
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      className="icon-btn"
      aria-label={label}
      onClick={() => {
        sfx.click();
        onClick();
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m15 18-6-6 6-6" />
      </svg>
    </button>
  );
}
