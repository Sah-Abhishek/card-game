import type { StatKey, ThemeDef } from './types';
import { Rng } from './rng';

export interface ShowdownPlayer {
  name: string;
  human: boolean;
  deck: string[]; // index 0 is the top card
}

export interface ShowdownResult {
  round: number;
  caller: number;
  stat: StatKey;
  /** cards flipped this round, by player index (only players still in) */
  revealed: { player: number; cardId: string; value: number }[];
  winner: number | null; // null = tie, cards go to the pot
  taken: string[]; // cards the winner collected (incl. pot)
  eliminated: number[];
}

export interface ShowdownState {
  players: ShowdownPlayer[];
  pot: string[];
  caller: number;
  round: number;
  maxRounds: number;
  seed: number;
  /** order the deck was dealt in, for the deal animation */
  dealOrder: { player: number; cardId: string }[];
  last: ShowdownResult | null;
  over: boolean;
  winner: number | null;
}

export function createShowdown(
  theme: ThemeDef,
  players: { name: string; human: boolean }[],
  seed: number,
  maxRounds = 60,
): ShowdownState {
  const rng = new Rng(seed);
  const deck = rng.shuffle(theme.cards.map((c) => c.id));
  const per = Math.floor(deck.length / players.length);
  const dealOrder: ShowdownState['dealOrder'] = [];
  const hands: string[][] = players.map(() => []);
  for (let i = 0; i < per * players.length; i++) {
    const player = i % players.length;
    hands[player].push(deck[i]);
    dealOrder.push({ player, cardId: deck[i] });
  }
  return {
    players: players.map((p, i) => ({ ...p, deck: hands[i] })),
    pot: deck.slice(per * players.length), // leftovers go to the first round's winner
    caller: rng.int(players.length),
    round: 1,
    maxRounds,
    seed: rng.seed,
    dealOrder,
    last: null,
    over: false,
    winner: null,
  };
}

export const inGame = (s: ShowdownState) => s.players.map((p, i) => (p.deck.length ? i : -1)).filter((i) => i >= 0);

export function playRound(theme: ThemeDef, state: ShowdownState, stat: StatKey): ShowdownState {
  if (state.over) throw new Error('game over');
  const s: ShowdownState = structuredClone(state);
  const rng = new Rng(s.seed);
  const live = inGame(s);
  const revealed = live.map((player) => {
    const cardId = s.players[player].deck.shift()!;
    const value = theme.cards.find((c) => c.id === cardId)!.stats[stat];
    return { player, cardId, value };
  });
  const top = Math.max(...revealed.map((r) => r.value));
  const leaders = revealed.filter((r) => r.value === top);
  let winner: number | null = null;
  let taken: string[] = [];
  if (leaders.length === 1) {
    winner = leaders[0].player;
    // winner's own card goes back first, then the rest in random order
    const others = rng.shuffle(revealed.filter((r) => r.player !== winner).map((r) => r.cardId));
    taken = [leaders[0].cardId, ...others, ...s.pot];
    s.players[winner].deck.push(...taken);
    s.pot = [];
    s.caller = winner;
  } else {
    s.pot.push(...revealed.map((r) => r.cardId));
  }
  const eliminated = live.filter((i) => s.players[i].deck.length === 0);
  // a caller knocked out on a tie hands the call to the next player still in
  if (!s.players[s.caller].deck.length) {
    const left = inGame(s);
    s.caller = left.find((i) => i > s.caller) ?? left[0] ?? s.caller;
  }
  s.last = { round: s.round, caller: state.caller, stat, revealed, winner, taken, eliminated };
  s.seed = rng.seed;
  const left = inGame(s);
  if (left.length <= 1 || s.round >= s.maxRounds) {
    s.over = true;
    // most cards wins; the pot is split by nobody
    s.winner = left.length ? left.reduce((a, b) => (s.players[b].deck.length > s.players[a].deck.length ? b : a)) : null;
  } else {
    s.round++;
  }
  return s;
}
