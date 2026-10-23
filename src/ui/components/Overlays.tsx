import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardDef } from '../../engine/types';
import { Rng } from '../../engine/rng';
import { GameCard } from './Card';
import './overlays.css';

export type Tone = 'gold' | 'red' | 'purple' | 'white';

export interface BannerData {
  id: number;
  text: string;
  sub?: string;
  tone?: Tone;
}

/** Big slammed-in callout across the middle of the screen. */
export function Banner({ banner }: { banner: BannerData | null }) {
  return (
    <AnimatePresence>
      {banner && (
        <motion.div
          key={banner.id}
          className={`banner tone-${banner.tone ?? 'gold'}`}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ scaleX: 0.6, opacity: 0, transition: { duration: 0.18 } }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        >
          <motion.b className="display" initial={{ scale: 1.8, opacity: 0, letterSpacing: '0.4em' }} animate={{ scale: 1, opacity: 1, letterSpacing: '0.06em' }} transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.05 }}>
            {banner.text}
          </motion.b>
          {banner.sub && (
            <motion.span initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
              {banner.sub}
            </motion.span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** The referee's count: 1 … 2 … 3 (or a kick-out at 2). */
export function PinCount({ count, result }: { count: number; result: 'kickout' | 'pinned' | 'sitsup' | null }) {
  return (
    <motion.div className="pin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="pin-label">{result === 'kickout' ? 'KICK OUT!' : result === 'sitsup' ? 'SITS UP!' : result === 'pinned' ? 'PINFALL!' : 'THE COVER…'}</div>
      <AnimatePresence mode="popLayout">
        {count > 0 && !result && (
          <motion.div key={count} className="pin-num display" initial={{ scale: 3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 22 }}>
            {count}
          </motion.div>
        )}
        {result && (
          <motion.div
            key={result}
            className={`pin-num display ${result === 'pinned' ? 'final' : 'kick'}`}
            initial={{ scale: 3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}
          >
            {result === 'pinned' ? '3!' : '2…'}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Full-screen finisher cinematic: rays, the card, the move name slammed in. */
export function FinisherCinematic({ card, move, phase }: { card: CardDef; move: string; phase: 'charge' | 'impact' }) {
  const letters = move.split('');
  return (
    <motion.div className={`finisher ${phase}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <div className="finisher-rays" />
      <motion.div className="finisher-card" initial={{ scale: 0.3, rotate: -20, y: 80 }} animate={{ scale: phase === 'impact' ? 1.12 : 1, rotate: 0, y: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
        <GameCard card={card} />
      </motion.div>
      <div className="finisher-tag eyebrow">{card.name} HITS THE</div>
      <div className="finisher-name display">
        {letters.map((ch, i) => (
          <motion.span key={i} initial={{ y: -80, opacity: 0, scale: 2 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.25 + i * 0.035, type: 'spring', stiffness: 600, damping: 20 }}>
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        ))}
      </div>
      {phase === 'impact' && <motion.div className="finisher-flash" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />}
    </motion.div>
  );
}

export interface Popup {
  id: number;
  text: string;
  tone: 'dmg' | 'heal' | 'gold';
}

export function Popups({ items }: { items: Popup[] }) {
  return (
    <div className="popups">
      <AnimatePresence>
        {items.map((p) => (
          <motion.div
            key={p.id}
            className={`popup display ${p.tone}`}
            initial={{ y: 10, scale: 0.4, opacity: 0, rotate: -6 }}
            animate={{ y: -40, scale: 1, opacity: 1, rotate: 6 }}
            exit={{ y: -90, opacity: 0, transition: { duration: 0.5 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 14 }}
          >
            {p.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Confetti({ count = 90 }: { count?: number }) {
  const bits = useMemo(() => {
    const rng = new Rng(count);
    return Array.from({ length: count }, (_, i) => ({
      left: rng.next() * 100,
      delay: rng.next() * 0.8,
      dur: 2.2 + rng.next() * 1.8,
      rot: rng.next() * 720 - 360,
      color: ['#f7e08a', '#ff1a35', '#ffffff', '#3dc8ff', '#ffd23d'][i % 5],
      w: 6 + rng.next() * 6,
      rest: rng.next(),
    }));
  }, [count]);
  return (
    <div className="confetti" aria-hidden>
      {bits.map((b, i) => (
        <motion.i
          key={i}
          style={{ left: `${b.left}%`, background: b.color, width: b.w, height: b.w * 0.45 }}
          initial={{ y: '-10vh', rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: b.rot, opacity: [1, 1, 0.6] }}
          transition={{ duration: b.dur, delay: b.delay, ease: 'easeIn', repeat: Infinity, repeatDelay: b.rest }}
        />
      ))}
    </div>
  );
}

/** Sweeping light burst behind a revealed card. */
export function RevealBurst() {
  return <motion.div className="reveal-burst" initial={{ scale: 0.2, opacity: 0.9 }} animate={{ scale: 2.2, opacity: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} />;
}
