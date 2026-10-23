import { describe, expect, it } from 'vitest';
import { wweTheme as T } from '../themes/wwe';
import { wweTrumpTheme as W } from '../themes/wwe-trump';
import { animeTheme as A } from '../themes/anime';
import { animeTrumpTheme as AT } from '../themes/anime-trump';
import { Rng } from './rng';
import { autoRoster, checkRoster } from './roster';
import { call, createMatch, finisher, pick, type MatchState, type Side, other } from './match';
import { aiChooseAction, aiPickSuperstar, aiShowdownCall } from './ai';
import { createShowdown, held, inGame, playRound } from './showdown';

const byId = (id: string) => T.cards.find((c) => c.id === id)!;

function duel(home: string, away: string, seed = 1): MatchState {
  const fill = T.cards.filter((c) => ![home, away].includes(c.id)).slice(0, 8).map((c) => c.id);
  let s = createMatch('YOU', [home, ...fill.slice(0, 4)], 'CPU', [away, ...fill.slice(4, 8)], seed);
  s = pick(T, s, 'home', home);
  return pick(T, s, 'away', away);
}

describe('theme data', () => {
  it('has 52 cards with derived OVR and rarity', () => {
    expect(T.cards).toHaveLength(52);
    expect(byId('the-rock').ovr).toBe(88);
    expect(byId('the-rock').rarity).toBe('legendary');
    expect(new Set(T.cards.map((c) => c.id)).size).toBe(52);
  });

  it('auto rosters always respect the cap and legendary limit', () => {
    for (let seed = 0; seed < 300; seed++) {
      const r = autoRoster(T, new Rng(seed));
      expect(checkRoster(T, r).ok).toBe(true);
    }
  });
});

describe('match rules', () => {
  it('higher SPD attacks first', () => {
    const s = duel('the-rock', 'undertaker'); // 82 vs 70
    expect(s.phase).toBe('exchange');
    expect(s.attacker).toBe('home');
    expect(s.event?.type).toBe('reveal');
  });

  it('exchange deals difference + 10 and grants momentum', () => {
    let s = duel('the-rock', 'undertaker');
    s = call(T, s, 'home', 'cha'); // 97 vs 88
    const ev = s.event!;
    expect(ev.type === 'exchange' && ev.winner).toBe('home');
    expect(s.away.active!.hp).toBe(100 - 19);
    expect(s.home.active!.momentum).toBe(1);
    expect(s.attacker).toBe('away');
  });

  it('ties go to the defender', () => {
    let s = duel('triple-h', 'roman-reigns'); // CHA 90 vs 90
    s.attacker = 'home';
    s = call(T, s, 'home', 'cha');
    const ev = s.event!;
    expect(ev.type === 'exchange' && ev.winner).toBe('away');
    expect(s.home.active!.hp).toBe(90);
  });

  it('cannot call the same stat twice in a row', () => {
    let s = duel('the-rock', 'undertaker');
    s = call(T, s, 'home', 'cha');
    s = call(T, s, 'away', 'pow');
    expect(() => call(T, s, 'home', 'cha')).toThrow(/last turn/);
    expect(() => call(T, s, 'home', 'spd')).toThrow(/cannot be called/);
  });

  it('finisher needs momentum, deals 30 and can pin', () => {
    let s = duel('stone-cold', 'andre-the-giant');
    expect(() => finisher(T, s, s.attacker)).toThrow();
    // stone cold's finisher costs 2
    s.home.active!.momentum = 2;
    s.attacker = 'home';
    s.away.active!.hp = 25;
    s = finisher(T, s, 'home');
    expect(s.event?.type).toBe('finisher');
    expect(s.home.wins).toBe(1);
    expect(s.away.eliminated).toContain('andre-the-giant');
    expect(s.phase).toBe('pick');
  });

  it('kicks out at 1 HP when holding enough momentum', () => {
    let s = duel('the-rock', 'kane');
    s.away.active!.hp = 5;
    s.away.active!.momentum = 2;
    s.attacker = 'home';
    s = call(T, s, 'home', 'cha'); // 97 vs 80
    expect(s.away.active!.hp).toBe(1);
    expect(s.away.active!.momentum).toBe(0);
    const ev = s.event!;
    expect(ev.type === 'exchange' && ev.kickout?.side).toBe('away');
  });

  it('only one kick-out per bout', () => {
    let s = duel('the-rock', 'kane');
    s.away.active!.hp = 5;
    s.away.active!.momentum = 3;
    s.away.active!.kickedOut = true;
    s.attacker = 'home';
    s = call(T, s, 'home', 'cha');
    expect(s.away.eliminated).toContain('kane');
    expect(s.home.wins).toBe(1);
  });

  it('heel cheat is caught when the opponent has more charisma', () => {
    let s = duel('kane', 'the-rock'); // kane HEEL, CHA 80 < 97
    s.attacker = 'home';
    s.home.active!.momentum = 1;
    s = call(T, s, 'home', 'pow', { cheat: true });
    const ev = s.event!;
    expect(ev.type === 'exchange' && ev.cheat?.caught).toBe(true);
    expect(s.home.cheatUsed).toBe(true);
  });

  it('heel cheat adds +10 when not caught', () => {
    let s = duel('triple-h', 'andre-the-giant'); // CHA 90 vs 90 -> not higher -> clean
    s.attacker = 'home';
    s = call(T, s, 'home', 'tec', { cheat: true });
    const ev = s.event!;
    expect(ev.type === 'exchange' && ev.cheat).toEqual({ caught: false, bonus: 10 });
    // 90 + 5 cerebral assassin + 2 RAW synergy (3 RAW cards in this roster) + 10 cheat
    expect(ev.type === 'exchange' && ev.values.home).toBe(107);
  });

  it('the deadman sits up once', () => {
    let s = duel('brock-lesnar', 'undertaker');
    s.attacker = 'home';
    s.away.active!.hp = 3;
    s = call(T, s, 'home', 'pow'); // 98 vs 94
    expect(s.away.active!.hp).toBe(1);
    expect(s.away.active!.abilityUsed).toBe(true);
  });
});

describe('simulated games', () => {
  it('AI vs AI matches always finish with a valid winner', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const a = autoRoster(T, rng).map((c) => c.id);
      const b = autoRoster(T, rng, a).map((c) => c.id);
      let s = createMatch('A', a, 'B', b, seed);
      let guard = 0;
      while (s.phase !== 'matchOver') {
        if (++guard > 500) throw new Error(`seed ${seed} stalled`);
        if (s.phase === 'pick') {
          for (const side of ['home', 'away'] as Side[])
            if (!s[side].active && !s[side].pending && s.phase === 'pick') s = pick(T, s, side, aiPickSuperstar(T, s, side, rng));
          continue;
        }
        const act = aiChooseAction(T, s, s.attacker, rng);
        s = act.type === 'finisher' ? finisher(T, s, s.attacker) : call(T, s, s.attacker, act.stat, { cheat: act.cheat });
      }
      const w = s.winner!;
      expect(s[w].wins).toBe(3);
      expect(s[other(w)].wins).toBeLessThan(3);
      expect(s[other(w)].eliminated).toHaveLength(3);
    }
  });

  it('showdown conserves cards and always ends', () => {
    for (let n = 2; n <= 6; n++) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        let s = createShowdown(T, Array.from({ length: n }, (_, i) => ({ name: `P${i}`, human: i === 0 })), seed);
        const total = () => s.players.reduce((a, p) => a + held(p), 0) + s.pot.length;
        expect(total()).toBe(T.cards.length);
        while (!s.over) {
          s = playRound(T, s, aiShowdownCall(T, s, s.caller, rng));
          expect(total()).toBe(T.cards.length);
          expect(s.players[s.caller].deck.length > 0 || s.over).toBe(true);
        }
        expect(s.winner === null || inGame(s).includes(s.winner)).toBe(true);
      }
    }
  });
});

describe('trump cards (52-card deck)', () => {
  const art = import.meta.glob('/public/cards/wwe/*.webp');

  it('has 52 unique cards with every body stat and art on disk', () => {
    expect(W.cards).toHaveLength(52);
    expect(new Set(W.cards.map((c) => c.id)).size).toBe(52);
    for (const c of W.cards) {
      for (const st of W.stats) expect(c.stats[st.key], `${c.id}.${st.key}`).toBeGreaterThan(0);
      expect(`/public/cards/wwe/${c.id}.webp` in art, c.id).toBe(true);
    }
  });

  it('deals equal hands, conserves cards and usually ends with one player holding all 52', () => {
    let sweeps = 0;
    let games = 0;
    for (let n = 2; n <= 4; n++) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        let s = createShowdown(W, Array.from({ length: n }, (_, i) => ({ name: `P${i}`, human: i === 0 })), seed, { maxRounds: 1000, wonPile: true });
        const hands = s.players.map((p) => p.deck.length);
        expect(new Set(hands).size).toBe(1);
        expect(s.pot).toHaveLength(52 % n);
        const total = () => s.players.reduce((a, p) => a + held(p), 0) + s.pot.length;
        while (!s.over) {
          s = playRound(W, s, aiShowdownCall(W, s, s.caller, rng));
          expect(total()).toBe(52);
          // anyone still in always has a top card to play
          for (const i of inGame(s)) expect(s.players[i].deck.length).toBeGreaterThan(0);
        }
        games++;
        if (s.winner !== null && held(s.players[s.winner]) === 52) sweeps++;
      }
    }
    expect(sweeps / games).toBeGreaterThan(0.9);
  });
});

describe('anime clash', () => {
  const art = import.meta.glob('/public/cards/anime/*.webp');

  it('has 52 unique characters with art, tags and stats', () => {
    expect(A.cards).toHaveLength(52);
    expect(new Set(A.cards.map((c) => c.id)).size).toBe(52);
    for (const c of A.cards) {
      expect(`/public/cards/anime/${c.id}.webp` in art, c.id).toBe(true);
      for (const t of A.tags) expect(t.values[c.tags[t.key]], `${c.id}.${t.key}`).toBeDefined();
      for (const st of A.stats) expect(c.stats[st.key]).toBeGreaterThan(0);
    }
  });

  it('auto rosters respect the cap and legendary limit', () => {
    for (let seed = 0; seed < 200; seed++) expect(checkRoster(A, autoRoster(A, new Rng(seed))).ok).toBe(true);
  });

  it('cpu vs cpu matches always finish', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      const home = autoRoster(A, rng).map((c) => c.id);
      const away = autoRoster(A, rng, home).map((c) => c.id);
      let s = createMatch('A', home, 'B', away, seed);
      for (let step = 0; step < 500 && s.phase !== 'matchOver'; step++) {
        if (s.phase === 'pick') {
          for (const side of ['home', 'away'] as Side[])
            if (!s[side].active && !s[side].pending && s.phase === 'pick') s = pick(A, s, side, aiPickSuperstar(A, s, side, rng));
          continue;
        }
        const act = aiChooseAction(A, s, s.attacker, rng);
        s = act.type === 'finisher' ? finisher(A, s, s.attacker) : call(A, s, s.attacker, act.stat, { cheat: act.cheat });
      }
      expect(s.phase).toBe('matchOver');
    }
  });

  it('trump deck re-rates every character and games end with one player holding all 52', () => {
    expect(AT.cards).toHaveLength(52);
    let sweeps = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const rng = new Rng(seed);
      let s = createShowdown(AT, [{ name: 'A', human: true }, { name: 'B', human: false }], seed, { maxRounds: 1000, wonPile: true });
      while (!s.over) s = playRound(AT, s, aiShowdownCall(AT, s, s.caller, rng));
      if (s.winner !== null && held(s.players[s.winner]) === 52) sweeps++;
    }
    expect(sweeps / 60).toBeGreaterThan(0.9);
  });
});
