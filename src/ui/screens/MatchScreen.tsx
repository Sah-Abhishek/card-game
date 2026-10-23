import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimate } from 'framer-motion';
import type { Nav } from '../../App';
import type { CardDef, StatKey } from '../../engine/types';
import { Rng, randomSeed } from '../../engine/rng';
import { autoRoster } from '../../engine/roster';
import {
  type MatchEvent,
  type MatchState,
  type Side,
  activeCard,
  availableToPick,
  call,
  callableStats,
  canCheat,
  canFinisher,
  cheatCaught,
  createMatch,
  effectiveStat,
  finisher,
  finisherCost,
  kickoutCost,
  needsPick,
  other,
  pick,
  tagRule,
} from '../../engine/match';
import { aiChooseAction, aiPickSuperstar } from '../../engine/ai';
import { Arena, HpBar, MuteButton, Pips } from '../components/Arena';
import { GameCard } from '../components/Card';
import { Banner, type BannerData, Confetti, FinisherCinematic, PinCount, type Popup, Popups, RevealBurst } from '../components/Overlays';
import { cardById, useTheme } from '../theme';
import { sfx } from '../sfx';
import './match.css';

const RIVALS = ['RIVAL_99', 'DEADMAN_FAN', 'RATTLESNAKE316', 'CENATION', 'HBK_SWEETCHIN', 'MASKED619', 'TRIBAL_CHIEF'];
const TURN_SECONDS = 20;

type Pin = { count: number; result: 'kickout' | 'pinned' | 'sitsup' | null } | null;

class Cancelled extends Error {}

export function MatchScreen({ nav, roster }: { nav: Nav; roster: string[] }) {
  const theme = useTheme();
  const [setup] = useState(() => {
    const seed = randomSeed();
    const rng = new Rng(seed);
    const away = autoRoster(theme, rng, roster).map((c) => c.id);
    return { seed, rng, rival: rng.pick(RIVALS), level: 20 + rng.int(15), away };
  });
  const rng = setup.rng;
  const [game, setGame] = useState<MatchState>(() => createMatch('YOU', roster, setup.rival, setup.away, setup.seed));
  const [view, setView] = useState<MatchState>(game);
  const [busy, setBusy] = useState(true);
  const [thinking, setThinking] = useState(false);

  // presentation-only state
  const [banner, setBannerState] = useState<BannerData | null>(null);
  const bannerId = useRef(0);
  const setBanner = (b: Omit<BannerData, 'id'> | null) => setBannerState(b ? { ...b, id: ++bannerId.current } : null);
  const [focus, setFocus] = useState<StatKey | null>(null);
  const [chips, setChips] = useState<{ values: Record<Side, number>; winner: Side | null; stat: StatKey } | null>(null);
  const [popups, setPopups] = useState<Record<Side, Popup[]>>({ home: [], away: [] });
  const popupId = useRef(0);
  const [hpOv, setHpOv] = useState<Partial<Record<Side, number>>>({});
  const [momOv, setMomOv] = useState<Partial<Record<Side, number>>>({});
  const [hidden, setHidden] = useState<Record<Side, boolean>>({ home: false, away: false });
  const [burst, setBurst] = useState<Record<Side, number>>({ home: 0, away: 0 });
  const [lunge, setLunge] = useState(false);
  const [recoil, setRecoil] = useState<Side | null>(null);
  const [leaving, setLeaving] = useState<Side | null>(null);
  const [cine, setCine] = useState<{ card: CardDef; move: string; phase: 'charge' | 'impact' } | null>(null);
  const [pin, setPin] = useState<Pin>(null);
  const [sheet, setSheet] = useState<'log' | 'roster' | null>(null);
  const [paused, setPaused] = useState(false);
  const [armed, setArmed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [timer, setTimer] = useState(TURN_SECONDS);
  const [scope, animate] = useAnimate();

  const statDef = (k: StatKey) => theme.stats.find((s) => s.key === k)!;
  const fighterName = (s: MatchState, side: Side) => activeCard(theme, s, side)?.name ?? '';

  const addPopup = (side: Side, text: string, tone: Popup['tone'] = 'dmg') => {
    const id = ++popupId.current;
    setPopups((p) => ({ ...p, [side]: [...p[side], { id, text, tone }] }));
    setTimeout(() => setPopups((p) => ({ ...p, [side]: p[side].filter((x) => x.id !== id) })), 1100);
  };

  const shake = (power = 1) =>
    scope.current &&
    animate(scope.current, { x: [0, -10 * power, 9 * power, -6 * power, 4 * power, 0], y: [0, 4 * power, -3 * power, 2 * power, 0] }, { duration: 0.42 });

  // ---------------------------------------------------------------- intro
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await wait(300);
      if (cancelled) return;
      sfx.bell(3);
      sfx.crowd(1.2, 2.4);
      setBanner({ text: 'IT’S TIME!', sub: `YOU vs ${setup.rival} · BEST OF ${theme.match.winsNeeded * 2 - 1}`, tone: 'gold' });
      await wait(1700);
      if (cancelled) return;
      setBanner({ text: `${theme.copy.bout.toUpperCase()} 1`, sub: `PICK YOUR ${theme.copy.fighter.toUpperCase()}`, tone: 'white' });
      await wait(1200);
      if (cancelled) return;
      setBanner(null);
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------- play events
  useEffect(() => {
    if (game === view) return;
    if (game.eventId === view.eventId) {
      setView(game);
      return;
    }
    const token = { cancelled: false };
    const sleep = async (ms: number) => {
      await wait(ms);
      if (token.cancelled) throw new Cancelled();
    };
    setBusy(true);
    const prev = view;
    const ev = game.event!;
    (async () => {
      try {
        if (ev.type === 'reveal') await playReveal(prev, game, ev, sleep);
        else if (ev.type === 'exchange') await playExchange(prev, game, ev, sleep);
        else await playFinisher(prev, game, ev, sleep);
        if (game.phase === 'pick') {
          setBanner({
            text: `${theme.copy.bout.toUpperCase()} ${game.bout}`,
            sub: needsPick(game, 'home') ? `SEND IN YOUR NEXT ${theme.copy.fighter.toUpperCase()}` : `${game.away.name} PICKS A NEW ${theme.copy.fighter.toUpperCase()}`,
            tone: 'white',
          });
          await sleep(1300);
        }
        if (game.phase === 'matchOver') {
          if (game.winner === 'home') sfx.win();
          else sfx.lose();
        }
      } catch (e) {
        if (!(e instanceof Cancelled)) throw e;
        return;
      }
      setBanner(null);
      setFocus(null);
      setChips(null);
      setHpOv({});
      setMomOv({});
      setLeaving(null);
      setHidden({ home: false, away: false });
      setView(game);
      setBusy(false);
    })();
    return () => {
      token.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  type Sleep = (ms: number) => Promise<void>;

  async function playReveal(_prev: MatchState, next: MatchState, ev: Extract<MatchEvent, { type: 'reveal' }>, sleep: Sleep) {
    setHidden({ home: ev.entered.includes('home'), away: ev.entered.includes('away') });
    setView(next);
    await sleep(500);
    for (const side of ['away', 'home'] as Side[]) {
      if (!ev.entered.includes(side)) continue;
      setHidden((h) => ({ ...h, [side]: false }));
      setBurst((b) => ({ ...b, [side]: b[side] + 1 }));
      sfx.flip();
      sfx.crowd(0.9, 1.2);
      await sleep(650);
    }
    setBanner({ text: `${fighterName(next, 'home')} vs ${fighterName(next, 'away')}`, sub: `${theme.copy.bout.toUpperCase()} ${next.bout}`, tone: 'gold' });
    await sleep(1500);
    const init = statDef(theme.initiativeStat).short;
    setBanner({
      text: `${ev.initiative === 'home' ? 'YOU ATTACK' : `${next.away.name} ATTACKS`} FIRST`,
      sub: ev.coinFlip ? `${init} TIED AT ${ev.speeds.home} — COIN TOSS` : `${init} ${ev.speeds.home} vs ${ev.speeds.away}`,
      tone: ev.initiative === 'home' ? 'white' : 'purple',
    });
    sfx.whoosh();
    await sleep(1400);
    setBanner(null);
  }

  async function koSequence(next: MatchState, kickout: { side: Side; undying: boolean } | null, pinned: Side | null, sleep: Sleep) {
    if (!kickout && !pinned) return;
    const victim = (kickout?.side ?? pinned)!;
    setPin({ count: 0, result: null });
    sfx.crowd(0.7, 1);
    await sleep(500);
    for (let n = 1; n <= (pinned ? 3 : 2); n++) {
      setPin({ count: n, result: null });
      sfx.count(n);
      await sleep(n === 3 ? 350 : 620);
    }
    if (kickout) {
      setPin({ count: 2, result: kickout.undying ? 'sitsup' : 'kickout' });
      sfx.kickout();
      shake(0.6);
      setHpOv((h) => ({ ...h, [victim]: 1 }));
      setMomOv((m) => ({ ...m, [victim]: next[victim].active!.momentum }));
      addPopup(victim, kickout.undying ? 'SITS UP!' : `-${kickoutCost(theme, activeCard(theme, next, victim)!)} MOMENTUM`, 'gold');
      await sleep(1300);
      setPin(null);
      return;
    }
    setPin({ count: 3, result: 'pinned' });
    sfx.bell(3);
    sfx.crowd(1.6, 2.6);
    await sleep(1500);
    setPin(null);
    const winner = other(victim);
    setLeaving(victim);
    sfx.whoosh();
    setBanner({
      text: `${winner === 'home' ? 'YOU WIN' : `${next.away.name} WINS`} ${theme.copy.bout.toUpperCase()} ${next.phase === 'pick' ? next.bout - 1 : next.bout}`,
      sub: `${next.home.wins} – ${next.away.wins}`,
      tone: winner === 'home' ? 'gold' : 'red',
    });
    await sleep(1700);
  }

  async function playExchange(prev: MatchState, next: MatchState, ev: Extract<MatchEvent, { type: 'exchange' }>, sleep: Sleep) {
    const atk = ev.attacker;
    const winner = ev.winner!;
    const loser = other(winner);
    const st = statDef(ev.stat);
    setBanner({ text: `${atk === 'home' ? 'YOU CALL' : `${prev.away.name} CALLS`} ${st.label}!`, tone: atk === 'home' ? 'gold' : 'purple' });
    sfx.whoosh();
    await sleep(800);
    let atkMom = prev[atk].active!.momentum;
    if (ev.cheat) {
      setBanner(
        ev.cheat.caught
          ? { text: 'CAUGHT CHEATING!', sub: 'THE REFEREE SAW EVERYTHING · −1 MOMENTUM', tone: 'red' }
          : { text: `HEEL CHEAT! +${ev.cheat.bonus}`, sub: 'BEHIND THE REFEREE’S BACK', tone: 'red' },
      );
      sfx.crowd(ev.cheat.caught ? 1.2 : 0.6, 1.4);
      if (ev.cheat.caught) {
        atkMom = next[atk].active ? Math.max(0, atkMom - 1) : atkMom;
        setMomOv({ [atk]: atkMom });
      }
      await sleep(1200);
    }
    setBanner(null);
    setFocus(ev.stat);
    setChips({ values: ev.values, winner: null, stat: ev.stat });
    sfx.select();
    await sleep(700);
    setLunge(true);
    sfx.whoosh();
    await sleep(240);
    setChips({ values: ev.values, winner, stat: ev.stat });
    setRecoil(loser);
    shake(Math.min(1.6, 0.6 + ev.damage / 25));
    sfx.hit(Math.min(1.3, 0.6 + ev.damage / 30));
    sfx.crowd(0.6 + Math.min(1, ev.damage / 30), 1.2);
    addPopup(loser, `-${ev.damage}`);
    if (ev.halved) setTimeout(() => addPopup(loser, 'HALF DAMAGE', 'gold'), 250);
    setHpOv({ [loser]: Math.max(0, prev[loser].active!.hp - ev.damage) });
    const winMomBase = winner === atk ? atkMom : prev[winner].active!.momentum;
    const newMom = Math.min(theme.match.maxMomentum, winMomBase + 1);
    setMomOv((m) => ({ ...m, [winner]: newMom }));
    if (newMom > winMomBase) setTimeout(() => sfx.momentum(), 200);
    setLunge(false);
    await sleep(950);
    setRecoil(null);
    for (const t of ev.triggers.filter((x) => !(ev.kickout?.undying && x.side === ev.kickout.side))) {
      setBanner({ text: t.name, sub: t.text.toUpperCase(), tone: 'gold' });
      sfx.crowd(0.9, 1.2);
      addPopup(t.side, 'ABILITY!', 'gold');
      await sleep(1600);
      setBanner(null);
    }
    await koSequence(next, ev.kickout, ev.pinned, sleep);
  }

  async function playFinisher(prev: MatchState, next: MatchState, ev: Extract<MatchEvent, { type: 'finisher' }>, sleep: Sleep) {
    const atk = ev.attacker;
    const def = other(atk);
    const card = activeCard(theme, prev, atk)!;
    setMomOv({ [atk]: prev[atk].active!.momentum - finisherCost(theme, card) });
    setCine({ card, move: ev.name, phase: 'charge' });
    sfx.finisher();
    sfx.crowd(1.1, 2);
    await sleep(1700);
    setCine({ card, move: ev.name, phase: 'impact' });
    sfx.bigHit();
    shake(2);
    await sleep(420);
    setCine(null);
    setRecoil(def);
    addPopup(def, `-${ev.damage}`);
    setHpOv({ [def]: Math.max(0, prev[def].active!.hp - ev.damage) });
    await sleep(1000);
    setRecoil(null);
    for (const t of ev.triggers.filter((x) => !(ev.kickout?.undying && x.side === ev.kickout.side))) {
      setBanner({ text: t.name, sub: t.text.toUpperCase(), tone: 'gold' });
      await sleep(1500);
      setBanner(null);
    }
    await koSequence(next, ev.kickout, ev.pinned, sleep);
  }

  // ---------------------------------------------------------------- CPU
  const synced = game === view && !busy && !paused;
  useEffect(() => {
    if (!synced) return;
    if (game.phase === 'pick' && needsPick(game, 'away')) {
      const t = setTimeout(() => {
        sfx.deal();
        setGame((g) => (needsPick(g, 'away') ? pick(theme, g, 'away', aiPickSuperstar(theme, g, 'away', rng)) : g));
      }, 900 + rng.int(700));
      return () => clearTimeout(t);
    }
    if (game.phase === 'exchange' && game.attacker === 'away') {
      setThinking(true);
      const t = setTimeout(
        () => {
          setThinking(false);
          const a = aiChooseAction(theme, game, 'away', rng);
          setGame(a.type === 'finisher' ? finisher(theme, game, 'away') : call(theme, game, 'away', a.stat, { cheat: a.cheat }));
        },
        1100 + rng.int(900),
      );
      return () => {
        clearTimeout(t);
        setThinking(false);
      };
    }
  }, [synced, game, theme, rng]);

  // ---------------------------------------------------------------- your turn timer
  const myTurn = synced && game.phase === 'exchange' && game.attacker === 'home';
  useEffect(() => {
    if (!myTurn) return;
    setTimer(TURN_SECONDS);
    const started = Date.now();
    const iv = setInterval(() => {
      const left = TURN_SECONDS - Math.floor((Date.now() - started) / 1000);
      setTimer(left);
      if (left <= 5 && left > 0) sfx.click();
      if (left <= 0) {
        clearInterval(iv);
        const a = aiChooseAction(theme, game, 'home', rng);
        setGame(a.type === 'finisher' ? finisher(theme, game, 'home') : call(theme, game, 'home', a.stat));
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [myTurn, game, theme, rng]);

  // ---------------------------------------------------------------- your actions
  const doCall = (stat: StatKey) => {
    if (!myTurn) return;
    sfx.select();
    setGame(call(theme, game, 'home', stat, { cheat: armed }));
    setArmed(false);
  };
  const doFinisher = () => {
    if (!myTurn || !canFinisher(theme, game, 'home')) return;
    setGame(finisher(theme, game, 'home'));
    setArmed(false);
  };
  const doPick = (id: string) => {
    if (!synced || !needsPick(game, 'home')) return;
    sfx.deal();
    setSelected(null);
    setGame(pick(theme, game, 'home', id));
  };

  // ---------------------------------------------------------------- render helpers
  const s = view;
  const hpOf = (side: Side) => hpOv[side] ?? s[side].active?.hp ?? theme.match.hp;
  const momOf = (side: Side) => momOv[side] ?? s[side].active?.momentum ?? 0;
  const slotCard = (side: Side) => {
    const f = s[side].active;
    const id = f?.cardId ?? s[side].pending;
    return id ? cardById(theme, id) : null;
  };

  const renderSlot = (side: Side) => {
    const card = slotCard(side);
    const isActive = !!s[side].active;
    const faceUp = isActive && !hidden[side];
    const dir = side === 'home' ? -1 : 1;
    return (
      <div className={`m-slot side-${side}`}>
        <AnimatePresence>
          {card ? (
            <motion.div
              key={card.id}
              className="m-card"
              initial={{ y: dir * -220, opacity: 0, rotate: dir * 12, scale: 0.7 }}
              animate={
                leaving === side
                  ? { x: dir * -40, y: dir * -30, rotate: dir * -25, opacity: 0, scale: 0.8, filter: 'grayscale(1)' }
                  : {
                      x: recoil === side ? [0, dir * 14, dir * -10, dir * 6, 0] : 0,
                      y: lunge ? dir * -26 : 0,
                      rotate: recoil === side ? [0, dir * 5, dir * -3, 0] : 0,
                      opacity: 1,
                      scale: lunge ? 1.04 : 1,
                      filter: 'grayscale(0)',
                    }
              }
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.3 } }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <GameCard card={side === 'home' || isActive ? card : null} faceUp={faceUp} focusStat={faceUp ? focus : null} />
              {recoil === side && <motion.div className="m-hitflash" initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} />}
              {burst[side] > 0 && <RevealBurst key={burst[side]} />}
            </motion.div>
          ) : (
            <motion.div key="empty" className="m-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {side === 'away' ? (
                <>
                  <span>{s.away.name}</span>
                  <b>IS CHOOSING</b>
                  <Dots />
                </>
              ) : (
                <>
                  <span>YOUR</span>
                  <b>{theme.copy.fighter.toUpperCase()}</b>
                  <span>GOES HERE</span>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {chips && s[side].active && (
          <motion.div
            className={`m-chip ${chips.winner === side ? 'win' : chips.winner ? 'lose' : ''}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: chips.winner === side ? 1.2 : 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          >
            <small>{statDef(chips.stat).short}</small>
            <b className="display">{chips.values[side]}</b>
          </motion.div>
        )}
        <Popups items={popups[side]} />
      </div>
    );
  };

  const renderStatus = (side: Side) => {
    const p = s[side];
    const card = p.active ? cardById(theme, p.active.cardId) : null;
    const hp = hpOf(side);
    const rally = card && tagRule(theme, card, 'rally');
    const rallying = !!rally && hp < rally.belowHp && hp > 0;
    return (
      <div className={`m-status side-${side}`}>
        <div className="m-player">
          <i className={`m-avatar side-${side}`} />
          <span>{side === 'home' ? 'YOU' : `${p.name} · LV ${setup.level}`}</span>
          {s.phase !== 'matchOver' && s.attacker === side && s.phase === 'exchange' && <em className="m-turn">TURN</em>}
        </div>
        <b className="m-name display">{card?.name ?? '—'}</b>
        <div className="m-hp-row">
          <span>HP</span>
          <b>
            {card ? Math.max(0, hp) : theme.match.hp} / {theme.match.hp}
          </b>
        </div>
        <HpBar hp={card ? hp : theme.match.hp} max={theme.match.hp} align={side === 'home' ? 'right' : 'left'} />
        <div className="m-mom">
          <span>MOMENTUM</span>
          <Pips value={momOf(side)} max={theme.match.maxMomentum} />
        </div>
        <div className="m-effects">
          {p.active?.boosts.map((b, i) => (
            <span key={i} className="m-fx gold">
              +{b.amount} {statDef(b.stat).short} · {b.turns}T
            </span>
          ))}
          {rallying && <span className="m-fx white">CROWD POP +{rally!.amount} {statDef(rally!.stat).short}</span>}
          {p.active?.kickedOut && <span className="m-fx red">KICKED OUT</span>}
        </div>
      </div>
    );
  };

  const rosterStrip = (side: Side) => {
    const p = s[side];
    return (
      <div className="m-strip-cards">
        {p.roster.map((id) => {
          const out = p.eliminated.includes(id);
          const active = p.active?.cardId === id;
          const known = side === 'home' || out || active;
          return (
            <div key={id} className={`m-mini ${out ? 'out' : ''} ${active ? 'active' : ''}`} title={known ? cardById(theme, id).name : 'Face-down'}>
              <GameCard card={known ? cardById(theme, id) : null} faceUp={known} flipDuration={0} />
              {out && <i>✕</i>}
            </div>
          );
        })}
      </div>
    );
  };

  const lastEvent = s.event;
  const strip = (() => {
    if (!lastEvent || lastEvent.type === 'reveal') return null;
    if (lastEvent.type === 'finisher') return { chip: 'FINISHER', a: lastEvent.name, text: `${lastEvent.damage} DAMAGE` };
    const st = statDef(lastEvent.stat).short;
    const w = lastEvent.winner!;
    return {
      chip: st,
      a: `${lastEvent.values[lastEvent.attacker]} vs ${lastEvent.values[other(lastEvent.attacker)]}`,
      text: `${w === 'home' ? `${s.away.name}` : 'YOU'} TOOK ${lastEvent.damage}`,
    };
  })();

  return (
    <motion.div ref={scope} className="match">
      <Arena />
      <header className="m-hud">
        <button className="icon-btn m-only-mobile" aria-label="Match log" onClick={() => setSheet('log')}>
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 3.5h12M2 8h12M2 12.5h8" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div className="m-score">
          <motion.b key={`h${s.home.wins}`} className="display" initial={{ scale: 1.8 }} animate={{ scale: 1 }}>
            {s.home.wins}
          </motion.b>
          <div>
            <span className="display">
              {theme.copy.bout.toUpperCase()} {Math.min(s.bout, theme.match.winsNeeded * 2 - 1)} OF {theme.match.winsNeeded * 2 - 1}
            </span>
            <small>{s.phase === 'exchange' ? `EXCHANGE ${s.exchange}` : s.phase === 'pick' ? 'ENTRANCES' : 'FINAL'}</small>
          </div>
          <motion.b key={`a${s.away.wins}`} className="display" initial={{ scale: 1.8 }} animate={{ scale: 1 }}>
            {s.away.wins}
          </motion.b>
        </div>
        <div className="m-hud-right">
          <MuteButton />
          <button className="icon-btn" aria-label="Pause" onClick={() => setPaused(true)}>
            <svg width="14" height="14" viewBox="0 0 16 16">
              <rect x="3" y="2" width="3.5" height="12" rx="1" fill="#fff" />
              <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="#fff" />
            </svg>
          </button>
        </div>
      </header>

      <div className="m-center">
        <section className="m-zone opp">
          <div className="m-side">
            {renderStatus('away')}
            <div className="m-roster-label">RIVAL ROSTER · {s.away.roster.length - s.away.eliminated.length} LEFT</div>
            {rosterStrip('away')}
          </div>
          {renderSlot('away')}
        </section>

        <div className="m-result">
          <AnimatePresence mode="wait">
            {strip && (
              <motion.div key={s.eventId} className="m-result-pill" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }}>
                <span className="m-result-chip">{strip.chip}</span>
                <b className="display">{strip.a}</b>
                <span>{strip.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <section className="m-zone me">
          {renderSlot('home')}
          <div className="m-side">
            {renderStatus('home')}
            <Abilities view={s} />
            <button className="m-roster-btn m-only-mobile" onClick={() => setSheet('roster')}>
              MY ROSTER <b>{s.home.roster.length - s.home.eliminated.length - (s.home.active ? 1 : 0)} READY</b>
            </button>
          </div>
        </section>
      </div>

      <footer className="m-sheet">
        <ActionSheet
          view={s}
          myTurn={myTurn}
          thinking={thinking}
          timer={timer}
          armed={armed}
          setArmed={setArmed}
          selected={selected}
          setSelected={setSelected}
          onCall={doCall}
          onFinisher={doFinisher}
          onPick={doPick}
          busy={!synced}
        />
      </footer>

      <aside className="m-panel left panel">
        <div className="section-title">YOUR ROSTER</div>
        <RosterList view={s} />
      </aside>
      <aside className="m-panel right panel">
        <div className="section-title">MATCH LOG</div>
        <Log view={s} />
      </aside>

      <Banner banner={banner} />
      <AnimatePresence>{pin && <PinCount count={pin.count} result={pin.result} />}</AnimatePresence>
      <AnimatePresence>{cine && <FinisherCinematic card={cine.card} move={cine.move} phase={cine.phase} />}</AnimatePresence>

      <AnimatePresence>
        {sheet && (
          <motion.div className="m-sheet-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSheet(null)}>
            <motion.div className="m-sheet-panel panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} onClick={(e) => e.stopPropagation()}>
              <i className="m-grabber" />
              <div className="section-title">{sheet === 'log' ? 'MATCH LOG' : 'YOUR ROSTER'}</div>
              {sheet === 'log' ? <Log view={s} /> : <RosterList view={s} />}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {paused && (
          <motion.div className="m-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="m-modal-box panel">
              <b className="display gold-text">PAUSED</b>
              <button className="btn btn-primary" onClick={() => setPaused(false)}>
                Resume
              </button>
              <button className="btn btn-ghost" onClick={() => nav({ name: 'home' })}>
                Quit to menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{s.phase === 'matchOver' && !busy && <MatchOver view={s} nav={nav} roster={roster} />}</AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------- sub components

function Dots() {
  return (
    <span className="dots">
      <i />
      <i />
      <i />
    </span>
  );
}

function Abilities({ view }: { view: MatchState }) {
  const theme = useTheme();
  const f = view.home.active;
  if (!f) return null;
  const card = cardById(theme, f.cardId);
  const e = card.ability.effect;
  const passive = e.kind === 'boostBelowHp' || e.kind === 'undying';
  const state = passive ? (f.abilityUsed ? 'USED' : e.kind === 'boostBelowHp' ? `${Math.max(0, f.hp - e.threshold + 1)} HP TO GO` : 'READY') : 'ALWAYS ON';
  const rally = tagRule(theme, card, 'rally');
  const cheat = tagRule(theme, card, 'cheat');
  return (
    <div className="m-abilities">
      <div className="m-ab">
        <b>{card.ability.name}</b>
        <small>{state}</small>
      </div>
      {rally && (
        <div className="m-ab">
          <b>CROWD POP · FACE</b>
          <small>{f.hp < rally.belowHp ? 'ACTIVE' : `${f.hp - rally.belowHp + 1} HP TO GO`}</small>
        </div>
      )}
      {cheat && (
        <div className="m-ab">
          <b>HEEL CHEAT</b>
          <small>{view.home.cheatUsed ? 'USED' : '1 USE'}</small>
        </div>
      )}
    </div>
  );
}

function RosterList({ view }: { view: MatchState }) {
  const theme = useTheme();
  return (
    <div className="m-roster">
      {view.home.roster.map((id) => {
        const c = cardById(theme, id);
        const out = view.home.eliminated.includes(id);
        const active = view.home.active?.cardId === id;
        return (
          <div key={id} className={`m-roster-row ${active ? 'active' : ''} ${out ? 'out' : ''}`}>
            <span className="m-ovr display">{c.ovr}</span>
            <b>{c.name}</b>
            <em>{active ? 'IN RING' : out ? 'OUT' : 'READY'}</em>
          </div>
        );
      })}
    </div>
  );
}

function Log({ view }: { view: MatchState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [view.log.length]);
  return (
    <div className="m-log scroll" ref={ref}>
      {view.log.map((l, i) => (
        <motion.div key={i} className={`m-log-row side-${l.side ?? 'none'} ${i === view.log.length - 1 ? 'latest' : ''}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
          <small>{l.tag}</small>
          <p>{l.text}</p>
        </motion.div>
      ))}
      {!view.log.length && <p className="m-log-empty">The bell is about to ring…</p>}
    </div>
  );
}

interface SheetProps {
  view: MatchState;
  myTurn: boolean;
  thinking: boolean;
  busy: boolean;
  timer: number;
  armed: boolean;
  setArmed: (b: boolean) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
  onCall: (stat: StatKey) => void;
  onFinisher: () => void;
  onPick: (id: string) => void;
}

function ActionSheet(p: SheetProps) {
  const theme = useTheme();
  const s = p.view;

  if (s.phase === 'matchOver') return <div className="m-sheet-msg display">FINAL BELL</div>;

  if (s.phase === 'pick') {
    if (!needsPick(s, 'home')) {
      return (
        <div className="m-sheet-msg">
          <span className="display">{s.home.pending ? 'LOCKED IN' : 'IN THE RING'}</span>
          <small>
            WAITING FOR {s.away.name}
            <Dots />
          </small>
        </div>
      );
    }
    const opts = availableToPick(s, 'home').map((id) => cardById(theme, id));
    const foe = activeCard(theme, s, 'away');
    return (
      <div className="m-pick">
        <div className="m-sheet-head">
          <b className="display">PICK YOUR {theme.copy.fighter.toUpperCase()}</b>
          <small>{foe ? `${foe.name} IS WAITING IN THE RING` : 'BOTH SIDES PICK FACE-DOWN'}</small>
        </div>
        <div className="m-hand">
          {opts.map((c, i) => {
            const sel = p.selected === c.id;
            const mid = (opts.length - 1) / 2;
            return (
              <motion.button
                key={c.id}
                className={`m-hand-card ${sel ? 'sel' : ''}`}
                initial={{ y: 120, opacity: 0, rotate: 0 }}
                animate={{ y: sel ? -26 : Math.abs(i - mid) * 5, rotate: (i - mid) * 4, opacity: 1, scale: sel ? 1.08 : 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20, delay: i * 0.05 }}
                onClick={() => {
                  if (p.busy) return;
                  if (sel) p.onPick(c.id);
                  else {
                    sfx.flick();
                    p.setSelected(c.id);
                  }
                }}
              >
                <GameCard card={c} />
                {foe && <FoeEdge card={c} foe={foe} />}
              </motion.button>
            );
          })}
        </div>
        <button className="btn btn-primary m-send" disabled={!p.selected || p.busy} onClick={() => p.selected && p.onPick(p.selected)}>
          {p.selected ? `Send in ${cardById(theme, p.selected).name}` : 'Tap a card'}
        </button>
      </div>
    );
  }

  const me = s.home.active!;
  const myCard = cardById(theme, me.cardId);
  const fCost = finisherCost(theme, myCard);
  const finOk = canFinisher(theme, s, 'home');
  const cheatOk = canCheat(theme, s, 'home');
  const caught = cheatOk && cheatCaught(theme, s, 'home');
  const cheatRule = tagRule(theme, myCard, 'cheat');

  return (
    <div className="m-actions">
      <div className="m-sheet-head row">
        {s.attacker === 'home' ? (
          <>
            <b className="display">YOUR CALL</b>
            <small>{p.myTurn ? 'pick a stat' : 'the crowd is on its feet'}</small>
          </>
        ) : (
          <>
            <b className="display rival">{s.away.name}’S CALL</b>
            <small>{p.thinking ? <>sizing you up<Dots /></> : 'watch out'}</small>
          </>
        )}
        {p.myTurn && (
          <span className={`m-timer ${p.timer <= 5 ? 'low' : ''}`}>
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" />
              <circle cx="18" cy="18" r="15" style={{ strokeDashoffset: 94.2 * (1 - p.timer / TURN_SECONDS) }} />
            </svg>
            <b>{Math.max(0, p.timer)}</b>
          </span>
        )}
      </div>
      <div className="m-stat-row">
        {callableStats(theme).map((k) => {
          const st = theme.stats.find((x) => x.key === k)!;
          const mine = effectiveStat(theme, s, 'home', k, true) + (p.armed && cheatRule && !caught ? cheatRule.bonus : 0);
          const theirs = effectiveStat(theme, s, 'away', k);
          const locked = me.lastCalled === k;
          const edge = mine - theirs;
          return (
            <button key={k} className={`m-stat-btn ${locked ? 'locked' : ''} ${edge > 0 ? 'up' : 'down'}`} disabled={!p.myTurn || locked} onClick={() => p.onCall(k)}>
              <small>
                {locked && '🔒 '}
                {st.short}
              </small>
              <b className="display">{mine}</b>
              <em>{locked ? 'USED LAST TURN' : `vs ${theirs} · ${edge > 0 ? `+${edge + theme.match.baseDamage} DMG` : edge === 0 ? 'TIE → THEM' : 'RISKY'}`}</em>
            </button>
          );
        })}
      </div>
      <div className="m-special-row">
        <button className={`m-finisher ${finOk && p.myTurn ? 'ready' : ''}`} disabled={!finOk || !p.myTurn} onClick={p.onFinisher}>
          <svg width="14" height="20" viewBox="0 0 14 20">
            <path d="M8 0 L0 11 L6 11 L5 20 L14 7 L8 7 Z" fill="#ffd23d" />
          </svg>
          <b>{myCard.finisher}</b>
          <Pips value={Math.min(me.momentum, fCost)} max={fCost} small />
        </button>
        {cheatOk && (
          <button
            className={`m-cheat ${p.armed ? 'armed' : ''} ${caught ? 'risky' : ''}`}
            disabled={!p.myTurn}
            onClick={() => {
              sfx.click();
              p.setArmed(!p.armed);
            }}
          >
            <b>{p.armed ? 'CHEAT ARMED' : 'CHEAT +10'}</b>
            <small>{caught ? 'RISKY · REF WATCHING' : 'SAFE'}</small>
          </button>
        )}
      </div>
    </div>
  );
}

/** Small hint on hand cards: how many callable stats beat the opponent in the ring. */
function FoeEdge({ card, foe }: { card: CardDef; foe: CardDef }) {
  const theme = useTheme();
  const wins = callableStats(theme).filter((k) => card.stats[k] > foe.stats[k]).length;
  return <span className={`m-edge e${wins}`}>{wins}/{callableStats(theme).length} BEAT</span>;
}

function MatchOver({ view, nav, roster }: { view: MatchState; nav: Nav; roster: string[] }) {
  const theme = useTheme();
  const won = view.winner === 'home';
  const hero = view[view.winner!].active ?? null;
  const card = hero ? cardById(theme, hero.cardId) : null;
  const pins = useMemo(() => view.log.filter((l) => l.tag === theme.copy.pin.toUpperCase()), [view.log, theme]);
  return (
    <motion.div className="m-modal over" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {won && <Confetti />}
      <motion.div className="m-over-box" initial={{ scale: 0.7, y: 40 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}>
        <span className="eyebrow">{won ? 'AND STILL…' : 'FINAL BELL'}</span>
        <b className={`display m-over-title ${won ? 'gold-text' : 'lose'}`}>{won ? 'YOU WIN!' : 'YOU LOSE'}</b>
        <span className="m-over-score display">
          {view.home.wins} – {view.away.wins}
        </span>
        {card && (
          <motion.div className="m-over-card" initial={{ rotateY: 180 }} animate={{ rotateY: 0 }} transition={{ delay: 0.3, duration: 0.9 }}>
            <GameCard card={card} interactive />
          </motion.div>
        )}
        <div className="m-over-pins">
          {pins.map((l, i) => (
            <span key={i}>{l.text}</span>
          ))}
        </div>
        <div className="m-over-actions">
          <button className="btn btn-primary" onClick={() => nav({ name: 'match', roster })}>
            Rematch
          </button>
          <button className="btn btn-ghost" onClick={() => nav({ name: 'roster' })}>
            New roster
          </button>
          <button className="btn btn-ghost" onClick={() => nav({ name: 'home' })}>
            Menu
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
