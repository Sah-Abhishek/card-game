import { motion } from 'framer-motion';
import type { Nav } from '../../App';
import { Arena, MuteButton } from '../components/Arena';
import { GameCard } from '../components/Card';
import { UNIVERSES } from '../../themes';
import { cardById, useTheme, useUniverse } from '../theme';
import { sfx } from '../sfx';
import './home.css';

export function Home({ nav }: { nav: Nav }) {
  const theme = useTheme();
  const { universe, setUniverse } = useUniverse();
  const trumpHint = universe.trump.stats
    .slice(0, 2)
    .map((s) => s.label.toLowerCase())
    .join(', ');
  const go = (fn: () => void) => () => {
    sfx.select();
    fn();
  };
  return (
    <div className="home-screen">
      <Arena ropes={false} />
      <header className="home-top">
        <span className="eyebrow">Trading Card Game</span>
        <MuteButton />
      </header>

      <div className="home-body">
        <motion.div className="home-logo" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
          <div className="display gold-text home-word">ARENA</div>
          <div className="display gold-text home-word">LEGENDS</div>
        </motion.div>

        <div className="home-fan">
          {universe.featured.map((id, i) => (
            <motion.div
              key={`${universe.id}-${id}`}
              className="home-fan-card"
              initial={{ y: 200, rotate: 0, opacity: 0 }}
              animate={{ y: i === 1 ? -14 : 0, rotate: (i - 1) * 12, x: (i - 1) * 62, opacity: 1 }}
              transition={{ delay: 0.25 + i * 0.12, type: 'spring', stiffness: 120, damping: 14 }}
              style={{ zIndex: i === 1 ? 3 : 1 }}
              onAnimationStart={() => sfx.deal(0.1 + i * 0.12)}
            >
              <GameCard card={cardById(theme, id)} interactive />
            </motion.div>
          ))}
        </div>

        <div className="home-themes">
          {UNIVERSES.map((u) => (
            <button
              key={u.id}
              className={`home-theme ${u.theme ? 'live' : 'locked'} ${u.id === universe.id ? 'on' : ''}`}
              style={{ ['--accent' as string]: u.accent }}
              disabled={!u.theme}
              aria-pressed={u.id === universe.id}
              onClick={() => {
                if (u.id === universe.id) return;
                sfx.flick();
                setUniverse(u.id);
              }}
            >
              <b>{u.name}</b>
              <small>{u.blurb}</small>
              {!u.theme && (
                <svg width="12" height="14" viewBox="0 0 14 16">
                  <rect x="1" y="7" width="12" height="9" rx="2" fill="currentColor" />
                  <path d="M4 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              )}
            </button>
          ))}
        </div>

        <motion.nav className="home-menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <button className="btn btn-primary home-play" onClick={go(() => nav({ name: 'roster' }))}>
            <span>Play Match</span>
            <small>1 vs 1 · Best of 5</small>
          </button>
          <button className="btn btn-gold home-play" onClick={go(() => nav({ name: 'showdownSetup', mode: 'showdown' }))}>
            <span>Showdown</span>
            <small>2–6 players · Quick play</small>
          </button>
          <button className="btn btn-gold home-play" onClick={go(() => nav({ name: 'showdownSetup', mode: 'trump' }))}>
            <span>Trump Cards</span>
            <small>
              {universe.trump.cards.length} cards · {trumpHint}…
            </small>
          </button>
          <div className="home-row">
            <button className="btn btn-ghost" onClick={go(() => nav({ name: 'collection' }))}>
              Collection
            </button>
            <button className="btn btn-ghost" onClick={go(() => nav({ name: 'rules' }))}>
              How to Play
            </button>
          </div>
        </motion.nav>
        <footer className="home-legal">{universe.legal}</footer>
      </div>
    </div>
  );
}
