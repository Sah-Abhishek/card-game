import type { StatKey, ThemeDef } from './types';
import { Rng } from './rng';
import {
  type MatchState,
  type Side,
  activeCard,
  availableToPick,
  callableStats,
  canCheat,
  canFinisher,
  cheatCaught,
  effectiveStat,
  finisherDamage,
  other,
} from './match';
import type { ShowdownState } from './showdown';

const card = (theme: ThemeDef, id: string) => theme.cards.find((c) => c.id === id)!;

/** Pick who goes into the ring. Counter the opponent if they're already in it. */
export function aiPickSuperstar(theme: ThemeDef, s: MatchState, side: Side, rng: Rng): string {
  const options = availableToPick(s, side).map((id) => card(theme, id));
  const foe = activeCard(theme, s, other(side));
  const keys = callableStats(theme);
  const score = (c: (typeof options)[number]) => {
    if (!foe) return c.ovr + rng.next() * 6;
    // how many callable stats beat the opponent, and by how much
    const margins = keys.map((k) => c.stats[k] - effectiveStat(theme, s, other(side), k)).sort((a, b) => b - a);
    return margins[0] * 1.5 + margins[1] + c.stats[theme.initiativeStat] * 0.15 + rng.next() * 3;
  };
  return options.sort((a, b) => score(b) - score(a))[0].id;
}

export type AiAction = { type: 'finisher' } | { type: 'call'; stat: StatKey; cheat: boolean };

export function aiChooseAction(theme: ThemeDef, s: MatchState, side: Side, rng: Rng): AiAction {
  if (canFinisher(theme, s, side)) return { type: 'finisher' };
  const me = s[side].active!;
  const foe = other(side);
  const options = callableStats(theme)
    .filter((k) => k !== me.lastCalled)
    .map((k) => ({
      stat: k,
      margin: effectiveStat(theme, s, side, k, true) - effectiveStat(theme, s, foe, k) + rng.next() * 0.5,
    }))
    .sort((a, b) => b.margin - a.margin);
  const best = options[0];
  // cheat when it flips a losing call, or can close out a wounded opponent
  const rule = theme.tags.flatMap((t) => Object.values(t.values)).find((v) => v.rule?.kind === 'cheat')?.rule;
  let cheat = false;
  if (rule?.kind === 'cheat' && canCheat(theme, s, side) && !cheatCaught(theme, s, side)) {
    const flips = best.margin <= 0 && best.margin + rule.bonus > 0;
    const foeHp = s[foe].active!.hp;
    const closes = best.margin > 0 && best.margin + rule.bonus + theme.match.baseDamage >= foeHp;
    cheat = flips || closes;
  }
  return { type: 'call', stat: best.stat, cheat };
}

/** Whether a finisher would end the bout outright — handy for the UI too. */
export const finisherWouldPin = (theme: ThemeDef, s: MatchState, side: Side) =>
  canFinisher(theme, s, side) && s[other(side)].active!.hp <= finisherDamage(theme, activeCard(theme, s, side)!);

// ---------------------------------------------------------------- showdown

/** Call the stat where this card stands out most against the whole deck. */
export function aiShowdownCall(theme: ThemeDef, s: ShowdownState, player: number, rng: Rng): StatKey {
  const top = card(theme, s.players[player].deck[0]);
  const keys = theme.stats.map((x) => x.key);
  const mean = (k: StatKey) => theme.cards.reduce((a, c) => a + c.stats[k], 0) / theme.cards.length;
  const sd = (k: StatKey) => {
    const m = mean(k);
    return Math.sqrt(theme.cards.reduce((a, c) => a + (c.stats[k] - m) ** 2, 0) / theme.cards.length) || 1;
  };
  return keys
    .map((k) => ({ k, z: (top.stats[k] - mean(k)) / sd(k) + rng.next() * 0.15 }))
    .sort((a, b) => b.z - a.z)[0].k;
}
