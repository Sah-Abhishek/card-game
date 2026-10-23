import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Nav } from '../../App';
import type { StatKey } from '../../engine/types';
import { Rng, randomSeed } from '../../engine/rng';
import { type ShowdownState, createShowdown, inGame, playRound } from '../../engine/showdown';
import { aiShowdownCall } from '../../engine/ai';
import { Arena, MuteButton } from '../components/Arena';
import { CardBack, GameCard } from '../components/Card';
import { ShuffleDeck } from '../components/ShuffleDeck';
import { Banner, type BannerData, Confetti } from '../components/Overlays';
import { cardById, useTheme } from '../theme';
import { sfx } from '../sfx';
import { DECK_MODES, type DeckMode } from '../modes';
import './showdown.css';

const BOT_NAMES = ['DEADMAN_FAN', 'RATTLESNAKE316', 'CENATION', 'HBK_SWEETCHIN', 'MASKED619', 'TRIBAL_CHIEF', 'NATURE_BOY'];
const COLORS = ['#d0021b', '#7a2ad0', '#4a4a52', '#1fa040', '#c02a8a', '#2a6ae0'];

type Phase = 'shuffle' | 'deal' | 'call' | 'reveal' | 'collect' | 'over';
interface Flight {
  id: number;
  from: Pos;
  to: Pos;
  delay: number;
  face?: string;
}
interface Pos {
  x: number;
  y: number;
}

const CENTER: Pos = { x: 50, y: 43 };

/** Seat centres (% of the table). You sit bottom centre; rivals fan across the top. */
function seatPositions(n: number): Pos[] {
  const out: Pos[] = [{ x: 50, y: 76 }];
  for (let k = 1; k < n; k++) {
    const t = Math.PI + (k * Math.PI) / n;
    out.push({ x: 50 + 39 * Math.cos(t), y: 46 + 31 * Math.sin(t) });
  }
  return out;
}

export function ShowdownScreen({ nav, mode, opponents }: { nav: Nav; mode: DeckMode; opponents: number }) {
  const theme = useTheme();
  const def = DECK_MODES[mode];
  const [rng] = useState(() => new Rng(randomSeed()));
  const [game, setGame] = useState<ShowdownState>(() => {
    const names = rng.shuffle(BOT_NAMES).slice(0, opponents);
    return createShowdown(
      theme,
      [{ name: 'YOU', human: true }, ...names.map((name) => ({ name, human: false }))],
      rng.next() * 2 ** 32,
      def.maxRounds,
    );
  });
  const n = game.players.length;
  const seats = useMemo(() => seatPositions(n), [n]);
  const [phase, setPhase] = useState<Phase>('shuffle');
  const [dealt, setDealt] = useState<number[]>(() => game.players.map(() => 0));
  const [flights, setFlights] = useState<Flight[]>([]);
  const flightId = useRef(0);
  const [banner, setBannerState] = useState<BannerData | null>(null);
  const bannerId = useRef(0);
  const setBanner = (b: Omit<BannerData, 'id'> | null) => setBannerState(b ? { ...b, id: ++bannerId.current } : null);
  const [called, setCalled] = useState<StatKey | null>(null);
  const [next, setNext] = useState<ShowdownState | null>(null);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());
  const [decided, setDecided] = useState(false); // all cards flipped, result can be shown
  const [speed, setSpeed] = useState(1);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const sleep = (ms: number) =>
    new Promise<void>((res, rej) => setTimeout(() => (alive.current ? res() : rej(new Error('unmounted'))), ms / speedRef.current));

  const fly = (from: Pos, to: Pos, delay = 0, face?: string) => {
    const id = ++flightId.current;
    setFlights((f) => [...f, { id, from, to, delay, face }]);
    setTimeout(() => setFlights((f) => f.filter((x) => x.id !== id)), (delay + 700) / speedRef.current + 50);
  };

  // ---------------------------------------------------------------- deal
  const startDeal = async () => {
    setPhase('deal');
    try {
      const counts = game.players.map(() => 0);
      for (const d of game.dealOrder) {
        fly(CENTER, seats[d.player]);
        sfx.deal();
        await sleep(55);
        counts[d.player]++;
        setDealt([...counts]);
      }
      await sleep(500);
      setBanner({ text: `${game.players[game.caller].human ? 'YOU CALL' : `${game.players[game.caller].name} CALLS`} FIRST`, sub: game.pot.length ? `${game.pot.length} CARDS IN THE POT` : 'ROUND 1', tone: 'gold' });
      sfx.crowd(0.8, 1.2);
      await sleep(1300);
      setBanner(null);
      setPhase('call');
    } catch {
      /* unmounted */
    }
  };

  // ---------------------------------------------------------------- bots call
  useEffect(() => {
    if (phase !== 'call') return;
    const caller = game.players[game.caller];
    if (caller.human) return;
    const t = setTimeout(() => resolve(aiShowdownCall(theme, game, game.caller, rng)), (1200 + rng.int(700)) / speedRef.current);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, game]);

  // ---------------------------------------------------------------- one round
  const resolve = async (stat: StatKey) => {
    if (phase !== 'call') return;
    const after = playRound(theme, game, stat);
    const r = after.last!;
    const st = theme.stats.find((s) => s.key === stat)!;
    setPhase('reveal');
    setCalled(stat);
    setNext(after);
    try {
      setBanner({ text: `${game.players[r.caller].human ? 'YOU CALL' : `${game.players[r.caller].name} CALLS`} ${st.label}!`, tone: game.players[r.caller].human ? 'gold' : 'purple' });
      sfx.whoosh();
      await sleep(1000);
      setBanner(null);
      // everyone flips, one after another around the table
      const order = r.revealed.map((x) => x.player).sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));
      for (const p of order) {
        setFlipped((f) => new Set(f).add(p));
        sfx.flip();
        await sleep(p === 0 ? 120 : 260);
      }
      await sleep(500);
      setDecided(true);
      if (r.winner !== null) {
        const w = after.players[r.winner];
        const card = cardById(theme, r.revealed.find((x) => x.player === r.winner)!.cardId);
        sfx.crowd(1.2, 1.6);
        if (r.winner === 0) sfx.momentum();
        setBanner({
          text: `${card.name} WINS!`,
          sub: `${w.human ? 'YOU TAKE' : `${w.name} TAKES`} ${r.taken.length} CARDS · ${st.short} ${r.revealed.find((x) => x.player === r.winner)!.value}${st.unit ? ` ${st.unit.toUpperCase()}` : ''}`,
          tone: r.winner === 0 ? 'gold' : 'white',
        });
      } else {
        sfx.hit(0.6);
        setBanner({ text: 'TIE!', sub: `${r.revealed.length} CARDS GO TO THE POT · ${after.pot.length} IN THE POT`, tone: 'red' });
      }
      await sleep(1500);
      setBanner(null);
      setPhase('collect');
      const dest = r.winner === null ? CENTER : seats[r.winner];
      r.revealed.forEach((x, i) => {
        fly(seats[x.player], dest, i * 70, x.cardId);
        sfx.deal(i * 0.07);
      });
      if (r.winner !== null && game.pot.length) fly(CENTER, dest, r.revealed.length * 70);
      await sleep(400);
      setFlipped(new Set());
      await sleep(500);
      setGame(after);
      setNext(null);
      setCalled(null);
      setDecided(false);
      setDealt(after.players.map((p) => p.deck.length));
      for (const e of r.eliminated) {
        setBanner({ text: `${after.players[e].human ? 'YOU ARE' : `${after.players[e].name} IS`} ELIMINATED`, tone: 'red' });
        sfx.bell(1);
        await sleep(1300);
        setBanner(null);
      }
      if (after.over) {
        setPhase('over');
        if (after.winner === 0) sfx.win();
        else sfx.lose();
      } else {
        await sleep(200);
        setPhase('call');
      }
    } catch {
      /* unmounted */
    }
  };

  // ---------------------------------------------------------------- render
  const shown = next ?? game;
  const live = inGame(game);
  const me = game.players[0];
  const myTop = me.deck[0] ? cardById(theme, me.deck[0]) : null;
  const myTurn = phase === 'call' && game.caller === 0 && !!myTop;
  const revealOf = (p: number) => next?.last?.revealed.find((x) => x.player === p);
  const r = next?.last;

  return (
    <div className={`showdown n${n}`}>
      <Arena table />
      <header className="sd-hud">
        <div className="sd-title">
          <b className="display gold-text">{def.title}</b>
          <small>
            {n} PLAYERS · ROUND {game.round}
          </small>
        </div>
        {called && (
          <motion.div className="sd-called" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            <small>CALLED</small>
            <b className="display">{theme.stats.find((s) => s.key === called)!.label}</b>
          </motion.div>
        )}
        <div className="sd-hud-right">
          <button className="icon-btn sd-speed" onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))} aria-label="Speed">
            {speed}×
          </button>
          <MuteButton />
          <button className="icon-btn" aria-label="Quit" onClick={() => nav({ name: 'home' })}>
            <svg width="16" height="16" viewBox="0 0 24 24" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </header>

      <div className="sd-table">
        {/* the deck / pot in the middle */}
        <div className="sd-center" style={{ left: `${CENTER.x}%`, top: `${CENTER.y}%` }}>
          {phase === 'shuffle' && <ShuffleDeck width={88} run onDone={startDeal} />}
          {phase === 'deal' && (
            <div className="sd-deck" style={{ opacity: game.dealOrder.length - dealt.reduce((a, b) => a + b, 0) > 0 ? 1 : 0 }}>
              <Back />
            </div>
          )}
          {phase !== 'shuffle' && phase !== 'deal' && shown.pot.length > 0 && (
            <motion.div className="sd-pot" initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
              <div className="sd-pot-stack">
                {Array.from({ length: Math.min(4, shown.pot.length) }, (_, i) => (
                  <div key={i} style={{ transform: `rotate(${(i - 1.5) * 9}deg)` }}>
                    <Back />
                  </div>
                ))}
              </div>
              <span className="pill">POT · {shown.pot.length}</span>
            </motion.div>
          )}
        </div>

        {game.players.map((p, i) => {
          const pos = seats[i];
          const count = phase === 'deal' || phase === 'shuffle' ? dealt[i] : p.deck.length;
          const rv = revealOf(i);
          const out = !live.includes(i) && phase !== 'shuffle' && phase !== 'deal';
          const isWinner = decided && r?.winner === i;
          const isLoser = decided && r && rv && r.winner !== i;
          const showFace = i === 0 ? !!(rv ?? myTop) && (phase !== 'collect' || !rv) : flipped.has(i);
          const faceCard = i === 0 ? (rv ? cardById(theme, rv.cardId) : myTop) : rv ? cardById(theme, rv.cardId) : null;
          return (
            <div key={i} className={`sd-seat ${i === 0 ? 'me' : ''} ${out ? 'out' : ''} ${game.caller === i && phase === 'call' ? 'caller' : ''}`} style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
              <div className="sd-tag">
                <i style={{ background: `linear-gradient(135deg, ${COLORS[i % COLORS.length]}, #111)` }} />
                <b>{p.human ? 'YOU' : p.name}</b>
                <motion.span key={count} initial={{ scale: 1.5 }} animate={{ scale: 1 }}>
                  {count}
                </motion.span>
                {game.caller === i && phase === 'call' && <em>CALLER</em>}
              </div>
              <div className="sd-stack">
                {count > 1 && (
                  <div className="sd-under">
                    <Back />
                  </div>
                )}
                {(count > 0 || rv) && (
                  <motion.div
                    className={`sd-top ${isWinner ? 'win' : ''} ${isLoser ? 'lose' : ''}`}
                    animate={{ y: rv && (phase === 'reveal' || phase === 'collect') ? (i === 0 ? -14 : 12) : 0, scale: isWinner && phase === 'reveal' ? 1.08 : 1 }}
                  >
                    <GameCard card={faceCard} faceUp={showFace} focusStat={showFace && called ? called : null} flipDuration={0.45} />
                  </motion.div>
                )}
                {out && <div className="sd-out display">OUT</div>}
              </div>
              <AnimatePresence>
                {rv && flipped.has(i) && phase !== 'collect' && (
                  <motion.div className={`sd-value ${isWinner ? 'win' : ''}`} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}>
                    <small>{theme.stats.find((s) => s.key === called)?.short}</small>
                    <b className="display">{rv.value}</b>
                    {isWinner && <em>★</em>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* cards in flight */}
        {flights.map((f) => (
          <motion.div
            key={f.id}
            className="sd-flight"
            initial={{ left: `${f.from.x}%`, top: `${f.from.y}%`, rotate: 0, scale: 0.9 }}
            animate={{ left: `${f.to.x}%`, top: `${f.to.y}%`, rotate: [0, 180, 360], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 0.5 / speed, delay: f.delay / 1000 / speed, ease: 'easeInOut' }}
          >
            <Back />
          </motion.div>
        ))}
      </div>

      <footer className="sd-sheet">
        {myTurn ? (
          <>
            <div className="sd-sheet-head">
              <b className="display">YOUR CALL</b>
              <small>Your top card: {myTop!.name}</small>
            </div>
            <div className={`sd-stats ${theme.stats.length > 4 ? 'many' : ''}`}>
              {theme.stats.map((s) => (
                <button
                  key={s.key}
                  className="sd-stat"
                  onClick={() => {
                    sfx.select();
                    void resolve(s.key);
                  }}
                >
                  <small>{s.short}</small>
                  <b className="display">{myTop!.stats[s.key]}</b>
                  {s.unit && <em>{s.unit}</em>}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="sd-sheet-msg">
            {phase === 'shuffle' && 'SHUFFLING THE DECK…'}
            {phase === 'deal' && 'DEALING…'}
            {phase === 'call' && !myTurn && `${game.players[game.caller].name} IS PICKING A STAT…`}
            {(phase === 'reveal' || phase === 'collect') && !decided && 'CARDS ON THE TABLE…'}
            {(phase === 'reveal' || phase === 'collect') && decided && (r?.winner === 0 ? 'YOU TAKE THE ROUND!' : r?.winner === null ? 'TIE — CARDS TO THE POT' : `${r ? game.players[r.winner!]?.name ?? '' : ''} TAKES THE ROUND`)}
            {phase === 'over' && 'GAME OVER'}
            {me.deck.length === 0 && phase === 'call' && ' · YOU’RE OUT — WATCHING'}
          </div>
        )}
      </footer>

      <Banner banner={banner} />

      <AnimatePresence>
        {phase === 'over' && (
          <motion.div className="m-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {game.winner === 0 && <Confetti />}
            <motion.div className="sd-over panel" initial={{ scale: 0.8, y: 30 }} animate={{ scale: 1, y: 0 }}>
              <span className="eyebrow">{game.round >= game.maxRounds ? 'TIME!' : mode === 'trump' ? `ALL ${theme.cards.length} CARDS WON` : 'LAST ONE STANDING'}</span>
              <b className={`display ${game.winner === 0 ? 'gold-text' : ''}`}>{game.winner === 0 ? 'YOU WIN!' : `${game.players[game.winner ?? 0].name} WINS`}</b>
              <div className="sd-standings">
                {[...game.players.keys()]
                  .sort((a, b) => game.players[b].deck.length - game.players[a].deck.length)
                  .map((i, rank) => (
                    <div key={i} className={i === 0 ? 'me' : ''}>
                      <span className="display">{rank + 1}</span>
                      <b>{game.players[i].human ? 'YOU' : game.players[i].name}</b>
                      <em>{game.players[i].deck.length} cards</em>
                    </div>
                  ))}
              </div>
              <div className="m-over-actions">
                <button className="btn btn-gold" onClick={() => nav({ name: 'showdown', mode, opponents })}>
                  Play again
                </button>
                <button className="btn btn-ghost" onClick={() => nav({ name: 'home' })}>
                  Menu
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Back() {
  return (
    <div className="card-root">
      <div className="card-face">
        <CardBack />
      </div>
    </div>
  );
}
