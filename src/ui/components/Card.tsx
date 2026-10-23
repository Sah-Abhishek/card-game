import { useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { motion } from 'framer-motion';
import type { CardDef, StatKey } from '../../engine/types';
import { RARITY_LABEL } from '../../engine/roster';
import { useTheme } from '../theme';
import './card.css';

const SHIELD = (id: string) => (
  <svg viewBox="0 0 118 140" aria-hidden>
    <defs>
      <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7a5a17" />
        <stop offset="0.3" stopColor="#fff3b0" />
        <stop offset="0.55" stopColor="#c99a35" />
        <stop offset="0.8" stopColor="#f7e08a" />
        <stop offset="1" stopColor="#6e5012" />
      </linearGradient>
    </defs>
    <path d="M59 2 L114 18 L114 72 C114 104 90 124 59 138 C28 124 4 104 4 72 L4 18 Z" fill={`url(#s${id})`} stroke="#3a2a06" strokeWidth="3" />
    <path
      d="M59 12 L105 25 L105 72 C105 98 86 115 59 127 C32 115 13 98 13 72 L13 25 Z"
      fill="none"
      stroke="#fff6c8"
      strokeOpacity="0.7"
      strokeWidth="1.5"
    />
  </svg>
);

const useSvgId = () => useId().replace(/[^a-zA-Z0-9]/g, '');

interface FrontProps {
  card: CardDef;
  focusStat?: StatKey | null;
  interactive?: boolean;
}

export function CardFront({ card, focusStat, interactive }: FrontProps) {
  const theme = useTheme();
  const id = useSvgId();
  const tilt = useTilt(interactive);
  const nameSize = Math.min(12.27, 88 / (card.name.length * 0.5));
  const style = {
    '--glow': card.palette.glow,
    '--mid': card.palette.mid,
    '--dark': card.palette.dark,
    '--name-size': `${nameSize}cqw`,
  } as CSSProperties;
  const tagVals = theme.tags.map((t) => ({ t, v: t.values[card.tags[t.key]] })).filter((x) => x.v);

  return (
    <div className="card-tilt" style={tilt.style} {...tilt.handlers}>
      <div className={`card rarity-${card.rarity} ${interactive ? 'interactive' : ''} ${tilt.active ? 'tilting' : ''}`} style={style}>
        <div className="card-hair" />
        <div className="card-art">
          <div className="card-spot" />
          <img className={`card-photo ${theme.art ?? 'cutout'}`} src={card.image} alt={card.name} draggable={false} loading="lazy" />
          <div className="card-tint" />
          <div className="card-headfade" />
          <div className="card-fade" />
          <svg className="card-plate" viewBox="0 0 690 150" preserveAspectRatio="none" aria-hidden>
            <defs>
              <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={card.palette.plateDark} />
                <stop offset="0.5" stopColor={card.palette.plate} />
                <stop offset="1" stopColor={card.palette.plateDark} />
              </linearGradient>
              <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#8f6b1d" />
                <stop offset="0.5" stopColor="#fff3b0" />
                <stop offset="1" stopColor="#8f6b1d" />
              </linearGradient>
            </defs>
            <polygon points="0,26 690,0 690,124 0,150" fill={`url(#r${id})`} />
            <polygon points="0,20 690,-6 690,2 0,28" fill={`url(#g${id})`} />
            <polygon points="0,146 690,120 690,128 0,154" fill={`url(#g${id})`} />
          </svg>
          <div className="card-name">{card.name}</div>
          <div className="card-nick">“{card.nickname}”</div>

          <div className="card-brand">
            <div className="card-league">{theme.league}</div>
            <div className="card-set">
              <b>{theme.setName}</b>
              <span>{theme.setYear}</span>
            </div>
          </div>
          <div className={`card-rarity ${card.rarity}`}>★ {RARITY_LABEL[card.rarity]}</div>
          <div className="card-number">
            {String(card.number).padStart(3, '0')} / {theme.printRun}
          </div>
          <div className="card-shield">
            {SHIELD(id)}
            <div className="card-ovr">{card.ovr}</div>
            <div className="card-ovr-label">OVR</div>
          </div>
          <div className="card-tags">
            {tagVals.map(({ t, v }) => (
              <span key={t.key} style={{ background: v.color, color: v.text }}>
                {v.label}
              </span>
            ))}
          </div>

          <div
            className={`card-stats ${focusStat ? 'has-focus' : ''} ${theme.stats.length > 4 ? 'many' : ''}`}
            style={{ '--n': theme.stats.length } as CSSProperties}
          >
            {theme.stats.map((s) => (
              <div key={s.key} className={`card-stat ${focusStat === s.key ? 'focus' : ''}`}>
                <b>{card.stats[s.key]}</b>
                <small>{s.short}</small>
              </div>
            ))}
          </div>
          <div className="card-finisher">
            <small>{theme.copy.finisher.toUpperCase()}</small>
            <svg width="1.9cqw" height="2.7cqw" viewBox="0 0 14 20" aria-hidden>
              <path d="M8 0 L0 11 L6 11 L5 20 L14 7 L8 7 Z" fill="#ffd23d" />
            </svg>
            <b>{card.finisher}</b>
          </div>
          <div className="card-seal" />
          <div className="card-holo" />
          <div className="card-glare" />
        </div>
        <div className="card-legal">
          ARENA LEGENDS TCG · {theme.league} {theme.setName} {theme.setYear.split('·')[0].trim()} · © 2026
        </div>
      </div>
    </div>
  );
}

export function CardBack({ interactive }: { interactive?: boolean }) {
  const id = useSvgId();
  const tilt = useTilt(interactive);
  return (
    <div className="card-tilt" style={tilt.style} {...tilt.handlers}>
      <div className={`card card-back ${interactive ? 'interactive' : ''} ${tilt.active ? 'tilting' : ''}`}>
        <div className="card-hair" />
        <div className="back-field">
          <div className="back-frame" />
          <div className="back-ring" />
          <svg className="back-shield" viewBox="0 0 118 140" aria-hidden>
            <defs>
              <linearGradient id={`bs${id}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#7a5a17" />
                <stop offset="0.3" stopColor="#fff3b0" />
                <stop offset="0.55" stopColor="#c99a35" />
                <stop offset="0.8" stopColor="#f7e08a" />
                <stop offset="1" stopColor="#6e5012" />
              </linearGradient>
              <linearGradient id={`bd${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#b0001a" />
                <stop offset="1" stopColor="#3a0008" />
              </linearGradient>
            </defs>
            <path d="M59 2 L114 18 L114 72 C114 104 90 124 59 138 C28 124 4 104 4 72 L4 18 Z" fill={`url(#bs${id})`} stroke="#3a2a06" strokeWidth="2" />
            <path d="M59 11 L106 25 L106 72 C106 99 86 116 59 128 C32 116 12 99 12 72 L12 25 Z" fill={`url(#bd${id})`} />
            <path
              d="M59 16 L101 28 L101 72 C101 96 83 111 59 122 C35 111 17 96 17 72 L17 28 Z"
              fill="none"
              stroke="#f7e08a"
              strokeOpacity="0.6"
              strokeWidth="0.8"
            />
          </svg>
          <div className="back-mono gold-text">AL</div>
          <div className="back-word gold-text" style={{ top: '14.7cqw' }}>
            ARENA
          </div>
          <div className="back-word gold-text" style={{ top: '92cqw' }}>
            LEGENDS
          </div>
          <div className="back-tag">TRADING CARD GAME</div>
          <div className="card-holo" />
          <div className="card-glare" />
        </div>
      </div>
    </div>
  );
}

interface GameCardProps {
  card?: CardDef | null;
  faceUp?: boolean;
  focusStat?: StatKey | null;
  interactive?: boolean;
  className?: string;
  style?: CSSProperties;
  flipDuration?: number;
}

/** A card that can flip between its face and the universal back. */
export function GameCard({ card, faceUp = true, focusStat, interactive, className, style, flipDuration = 0.6 }: GameCardProps) {
  const showFace = faceUp && !!card;
  return (
    <div className={`card-root ${className ?? ''}`} style={style}>
      <motion.div
        className="card-flipper"
        initial={false}
        animate={{ rotateY: showFace ? 0 : 180 }}
        transition={{ duration: flipDuration, ease: [0.3, 1.4, 0.5, 1] }}
      >
        <div className="card-face">{card && <CardFront card={card} focusStat={focusStat} interactive={interactive} />}</div>
        <div className="card-face back-face">
          <CardBack interactive={interactive} />
        </div>
      </motion.div>
    </div>
  );
}

/** Pointer-tracked tilt + holo position, for cards you can pick up and inspect. */
function useTilt(enabled?: boolean) {
  const [active, setActive] = useState(false);
  const [vars, setVars] = useState<CSSProperties>({});
  const frame = useRef(0);
  if (!enabled) return { active: false, style: undefined, handlers: {} };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() =>
      setVars({
        '--rx': `${(0.5 - y) * 22}deg`,
        '--ry': `${(x - 0.5) * 26}deg`,
        '--mx': `${x * 100}%`,
        '--my': `${y * 100}%`,
      } as CSSProperties),
    );
  };
  return {
    active,
    style: vars,
    handlers: {
      onPointerMove: move,
      onPointerEnter: () => setActive(true),
      onPointerLeave: () => {
        setActive(false);
        setVars({});
      },
    },
  };
}
