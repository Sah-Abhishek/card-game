import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Nav } from '../../App';
import type { CardDef } from '../../engine/types';
import { RARITY_LABEL } from '../../engine/roster';
import { Arena, BackButton, MuteButton } from '../components/Arena';
import { GameCard } from '../components/Card';
import { CardInfo } from '../components/CardInfo';
import { useTheme } from '../theme';
import { sfx } from '../sfx';
import './collection.css';

type Sort = 'number' | 'ovr' | 'name';

export function Collection({ nav }: { nav: Nav }) {
  const theme = useTheme();
  const [filter, setFilter] = useState<string>('ALL');
  const [sort, setSort] = useState<Sort>('ovr');
  const [open, setOpen] = useState<CardDef | null>(null);
  const brandTag = theme.tags.find((t) => t.synergy)!;
  const filters = ['ALL', ...Object.keys(brandTag.values), 'LEGENDARY'];

  const cards = useMemo(() => {
    const list = theme.cards.filter((c) =>
      filter === 'ALL' ? true : filter === 'LEGENDARY' ? c.rarity === 'legendary' : c.tags[brandTag.key] === filter,
    );
    return list.sort((a, b) => (sort === 'ovr' ? b.ovr - a.ovr : sort === 'name' ? a.name.localeCompare(b.name) : a.number - b.number));
  }, [theme, filter, sort, brandTag.key]);

  return (
    <div className="collection">
      <Arena ropes={false} />
      <header className="sub-top">
        <BackButton onClick={() => nav({ name: 'home' })} />
        <div className="sub-title">
          <span className="eyebrow">{theme.name}</span>
          <b className="display">COLLECTION</b>
        </div>
        <MuteButton />
      </header>
      <div className="col-controls">
        <div className="col-chips">
          {filters.map((f) => (
            <button
              key={f}
              className={`col-chip ${filter === f ? 'on' : ''}`}
              onClick={() => {
                sfx.click();
                setFilter(f);
              }}
            >
              {brandTag.values[f]?.label ?? f}
            </button>
          ))}
        </div>
        <select className="col-sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="ovr">Sort: OVR</option>
          <option value="number">Sort: Card #</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>
      <div className="col-grid scroll">
        {cards.map((c, i) => (
          <motion.button
            key={c.id}
            className="col-item"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 12) * 0.03 }}
            onClick={() => {
              sfx.flip();
              setOpen(c);
            }}
          >
            <GameCard card={c} />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && <Inspect card={open} onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </div>
  );
}

function Inspect({ card, onClose }: { card: CardDef; onClose: () => void }) {
  const [faceUp, setFaceUp] = useState(true);
  return (
    <motion.div className="inspect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <div className="inspect-body" onClick={(e) => e.stopPropagation()}>
        <motion.div
          className="inspect-card"
          initial={{ scale: 0.6, rotateY: -90, y: 60 }}
          animate={{ scale: 1, rotateY: 0, y: 0 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          onClick={() => {
            sfx.flip();
            setFaceUp((f) => !f);
          }}
        >
          <GameCard card={card} faceUp={faceUp} interactive />
          <span className="inspect-hint">Tap card to flip · {RARITY_LABEL[card.rarity]}</span>
        </motion.div>
        <motion.div className="inspect-info" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <CardInfo card={card} />
        </motion.div>
      </div>
      <button className="icon-btn inspect-close" aria-label="Close" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3" strokeLinecap="round">
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>
    </motion.div>
  );
}
