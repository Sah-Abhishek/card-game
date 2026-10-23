import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Nav } from '../../App';
import type { CardDef } from '../../engine/types';
import { autoRoster, canAdd, checkRoster } from '../../engine/roster';
import { Rng, randomSeed } from '../../engine/rng';
import { Arena, BackButton, MuteButton } from '../components/Arena';
import { GameCard } from '../components/Card';
import { useTheme } from '../theme';
import { sfx } from '../sfx';
import './roster.css';

const KEY = 'al-last-roster';

export function RosterBuilder({ nav }: { nav: Nav }) {
  const theme = useTheme();
  const [picked, setPicked] = useState<CardDef[]>(() => {
    try {
      const ids: string[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      const cards = ids.map((id) => theme.cards.find((c) => c.id === id)).filter(Boolean) as CardDef[];
      return checkRoster(theme, cards).ok ? cards : [];
    } catch {
      return [];
    }
  });
  const check = checkRoster(theme, picked);
  const size = theme.match.rosterSize;
  const sorted = useMemo(() => [...theme.cards].sort((a, b) => b.ovr - a.ovr), [theme]);
  const pct = Math.min(100, (check.totalOvr / theme.match.ovrCap) * 100);
  const synergyTag = theme.tags.find((t) => t.synergy);
  const brandCounts = synergyTag
    ? Object.keys(synergyTag.values)
        .map((v) => [v, picked.filter((c) => c.tags[synergyTag.key] === v).length] as const)
        // a long list (e.g. 12 anime) only shows the ones already in the roster
        .filter(([, n], _, all) => all.length <= 4 || n > 0)
    : [];

  const toggle = (c: CardDef) => {
    if (picked.some((p) => p.id === c.id)) {
      sfx.flick();
      setPicked(picked.filter((p) => p.id !== c.id));
    } else if (canAdd(theme, picked, c)) {
      sfx.deal();
      setPicked([...picked, c]);
    } else {
      sfx.click();
    }
  };

  const start = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(picked.map((c) => c.id)));
    } catch {
      /* ignore */
    }
    sfx.bell(2);
    nav({ name: 'match', roster: picked.map((c) => c.id) });
  };

  return (
    <div className="subscreen roster">
      <Arena ropes={false} />
      <header className="sub-top">
        <BackButton onClick={() => nav({ name: 'home' })} />
        <div className="sub-title">
          <span className="eyebrow">Match · Step 1</span>
          <b className="display">BUILD YOUR ROSTER</b>
        </div>
        <MuteButton />
      </header>

      <div className="roster-grid scroll">
        {sorted.map((c) => {
          const on = picked.some((p) => p.id === c.id);
          const blocked = !on && !canAdd(theme, picked, c);
          return (
            <button key={c.id} className={`roster-item ${on ? 'on' : ''} ${blocked ? 'blocked' : ''}`} onClick={() => toggle(c)}>
              <GameCard card={c} />
              {on && (
                <motion.span className="roster-check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  ✓
                </motion.span>
              )}
              {blocked && picked.length < size && <span className="roster-why">{c.rarity === 'legendary' && check.legendaries >= theme.match.maxLegendary ? '1 LEGENDARY MAX' : 'OVER CAP'}</span>}
            </button>
          );
        })}
      </div>

      <div className="roster-tray panel">
        <div className="tray-slots">
          {Array.from({ length: size }, (_, i) => (
            <div key={i} className="tray-slot">
              <AnimatePresence>
                {picked[i] && (
                  <motion.button
                    key={picked[i].id}
                    className="tray-card"
                    initial={{ y: -80, opacity: 0, rotate: -10 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: -40, opacity: 0 }}
                    onClick={() => toggle(picked[i])}
                  >
                    <GameCard card={picked[i]} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        <div className="tray-meta">
          <div className="tray-meter">
            <div className="tray-meter-top">
              <span>TOTAL OVR</span>
              <b className={check.totalOvr > theme.match.ovrCap ? 'over' : ''}>
                {check.totalOvr} / {theme.match.ovrCap}
              </b>
            </div>
            <div className="tray-bar">
              <motion.i animate={{ width: `${pct}%` }} />
            </div>
            <div className="tray-notes">
              <span>
                LEGENDARY {check.legendaries}/{theme.match.maxLegendary}
              </span>
              {brandCounts.map(([v, n]) => (
                <span key={v} className={n >= (synergyTag?.synergy?.count ?? 99) ? 'hot' : ''}>
                  {synergyTag!.values[v].label} ×{n}
                  {n >= (synergyTag?.synergy?.count ?? 99) && ` · +${synergyTag!.synergy!.bonus} ALL STATS`}
                </span>
              ))}
            </div>
          </div>
          <div className="tray-actions">
            <button
              className="btn btn-ghost"
              onClick={() => {
                sfx.riffle(0.4);
                setPicked(autoRoster(theme, new Rng(randomSeed())));
              }}
            >
              Auto-pick
            </button>
            <button className="btn btn-primary" disabled={!check.ok} onClick={start}>
              Start Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
