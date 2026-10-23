import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Nav } from '../../App';
import { Arena, BackButton, MuteButton } from '../components/Arena';
import { CardBack } from '../components/Card';
import { useTheme } from '../theme';
import { sfx } from '../sfx';
import { DECK_MODES, type DeckMode } from '../modes';
import './showdown.css';

export function ShowdownSetup({ nav, mode }: { nav: Nav; mode: DeckMode }) {
  const theme = useTheme();
  const def = DECK_MODES[mode];
  const [opponents, setOpponents] = useState(def.defaultOpponents);
  const players = opponents + 1;
  const per = Math.floor(theme.cards.length / players);
  const pot = theme.cards.length - per * players;
  return (
    <div className="subscreen">
      <Arena ropes={false} />
      <header className="sub-top">
        <BackButton onClick={() => nav({ name: 'home' })} />
        <div className="sub-title">
          <span className="eyebrow">{def.eyebrow}</span>
          <b className="display">{def.title}</b>
        </div>
        <MuteButton />
      </header>
      <div className="sd-setup">
        <div className="sd-setup-fan">
          {Array.from({ length: players }, (_, i) => (
            <motion.div
              key={i}
              className="sd-setup-card"
              animate={{ rotate: (i - (players - 1) / 2) * 9, x: (i - (players - 1) / 2) * 34, y: Math.abs(i - (players - 1) / 2) * 8 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <div className="card-root">
                <div className="card-face">
                  <CardBack />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="eyebrow">How many opponents?</div>
        <div className="sd-count">
          {def.opponents.map((n) => (
            <button
              key={n}
              className={`sd-count-btn display ${opponents === n ? 'on' : ''}`}
              onClick={() => {
                sfx.flick();
                setOpponents(n);
              }}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="sd-setup-note">
          {players} players · {per} cards each{pot ? ` · ${pot} to the pot` : ''}. {def.rules}
        </p>
        <button
          className="btn btn-gold sd-start"
          onClick={() => {
            sfx.select();
            nav({ name: 'showdown', mode, opponents });
          }}
        >
          Shuffle up & deal
        </button>
        <button className="sd-rules-link" onClick={() => nav({ name: 'rules', tab: mode })}>
          How to play {def.title.toLowerCase()} ›
        </button>
      </div>
    </div>
  );
}
