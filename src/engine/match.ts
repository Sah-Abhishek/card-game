import type { AbilityEffect, CardDef, StatKey, TagRule, ThemeDef } from './types';
import { Rng } from './rng';
import { synergyBonus } from './roster';

export type Side = 'home' | 'away';
export const other = (s: Side): Side => (s === 'home' ? 'away' : 'home');

export interface Boost {
  stat: StatKey;
  amount: number;
  turns: number;
}

export interface Fighter {
  cardId: string;
  hp: number;
  momentum: number;
  lastCalled: StatKey | null;
  boosts: Boost[];
  abilityUsed: boolean;
  kickedOut: boolean; // one kick-out per bout
}

export interface PlayerState {
  name: string;
  roster: string[];
  eliminated: string[];
  active: Fighter | null;
  pending: string | null; // picked face-down, not yet revealed
  wins: number;
  cheatUsed: boolean;
}

export interface AbilityTrigger {
  side: Side;
  name: string;
  text: string;
}

export type MatchEvent =
  | {
      type: 'reveal';
      entered: Side[];
      initiative: Side;
      speeds: Record<Side, number>;
      coinFlip: boolean;
    }
  | {
      type: 'exchange';
      attacker: Side;
      stat: StatKey;
      values: Record<Side, number>;
      cheat: { caught: boolean; bonus: number } | null;
      winner: Side | null;
      damage: number;
      halved: boolean;
      triggers: AbilityTrigger[];
      kickout: { side: Side; undying: boolean } | null;
      pinned: Side | null;
    }
  | {
      type: 'finisher';
      attacker: Side;
      name: string;
      damage: number;
      triggers: AbilityTrigger[];
      kickout: { side: Side; undying: boolean } | null;
      pinned: Side | null;
    };

export interface LogEntry {
  bout: number;
  tag: string;
  text: string;
  side: Side | null;
}

export type MatchPhase = 'pick' | 'exchange' | 'matchOver';

export interface MatchState {
  phase: MatchPhase;
  bout: number;
  exchange: number;
  attacker: Side;
  home: PlayerState;
  away: PlayerState;
  seed: number;
  log: LogEntry[];
  event: MatchEvent | null;
  eventId: number;
  winner: Side | null;
}

// ---------------------------------------------------------------- helpers

const cardOf = (theme: ThemeDef, id: string): CardDef => {
  const c = theme.cards.find((x) => x.id === id);
  if (!c) throw new Error(`unknown card ${id}`);
  return c;
};

const effectOf = <K extends AbilityEffect['kind']>(card: CardDef, kind: K) =>
  card.ability.effect.kind === kind ? (card.ability.effect as Extract<AbilityEffect, { kind: K }>) : null;

/** Tag rule (cheat / rally) a card carries, if any. */
export function tagRule<K extends TagRule['kind']>(theme: ThemeDef, card: CardDef, kind: K) {
  for (const tag of theme.tags) {
    const rule = tag.values[card.tags[tag.key]]?.rule;
    if (rule?.kind === kind) return rule as Extract<TagRule, { kind: K }>;
  }
  return null;
}

export const callableStats = (theme: ThemeDef) =>
  theme.stats.map((s) => s.key).filter((k) => k !== theme.initiativeStat);

export const activeCard = (theme: ThemeDef, s: MatchState, side: Side) => {
  const f = s[side].active;
  return f ? cardOf(theme, f.cardId) : null;
};

const rosterCards = (theme: ThemeDef, p: PlayerState) => p.roster.map((id) => cardOf(theme, id));

/** Stat value after synergy, boosts and rally — what the UI should display. */
export function effectiveStat(
  theme: ThemeDef,
  s: MatchState,
  side: Side,
  stat: StatKey,
  calling = false,
): number {
  const p = s[side];
  const f = p.active;
  if (!f) return 0;
  const card = cardOf(theme, f.cardId);
  let v = card.stats[stat] + synergyBonus(theme, rosterCards(theme, p), card);
  for (const b of f.boosts) if (b.stat === stat) v += b.amount;
  const rally = tagRule(theme, card, 'rally');
  if (rally && rally.stat === stat && f.hp < rally.belowHp) v += rally.amount;
  const boost = effectOf(card, 'statBoost');
  if (calling && boost && boost.stat === stat) v += boost.amount;
  return v;
}

export const finisherCost = (theme: ThemeDef, card: CardDef) =>
  effectOf(card, 'finisherCost')?.cost ?? theme.match.finisherCost;

export const finisherDamage = (theme: ThemeDef, card: CardDef) =>
  theme.match.finisherDamage + (effectOf(card, 'finisherDamage')?.amount ?? 0);

export const kickoutCost = (theme: ThemeDef, card: CardDef) =>
  effectOf(card, 'kickoutDiscount')?.cost ?? theme.match.kickoutCost;

export const canFinisher = (theme: ThemeDef, s: MatchState, side: Side) => {
  const f = s[side].active;
  return !!f && s.phase === 'exchange' && s.attacker === side && f.momentum >= finisherCost(theme, cardOf(theme, f.cardId));
};

export const canCheat = (theme: ThemeDef, s: MatchState, side: Side) => {
  const c = activeCard(theme, s, side);
  return !!c && !s[side].cheatUsed && !!tagRule(theme, c, 'cheat');
};

/** Would a cheat by `side` be caught right now? */
export function cheatCaught(theme: ThemeDef, s: MatchState, side: Side): boolean {
  const c = activeCard(theme, s, side);
  const rule = c && tagRule(theme, c, 'cheat');
  if (!c || !rule || effectOf(c, 'cleanCheat')) return false;
  return effectiveStat(theme, s, other(side), rule.catchStat) > effectiveStat(theme, s, side, rule.catchStat);
}

export const availableToPick = (s: MatchState, side: Side) => {
  const p = s[side];
  return p.roster.filter((id) => !p.eliminated.includes(id) && id !== p.active?.cardId);
};

export const needsPick = (s: MatchState, side: Side) =>
  s.phase === 'pick' && !s[side].active && !s[side].pending;

// ---------------------------------------------------------------- setup

const newPlayer = (name: string, roster: string[]): PlayerState => ({
  name,
  roster,
  eliminated: [],
  active: null,
  pending: null,
  wins: 0,
  cheatUsed: false,
});

export function createMatch(
  homeName: string,
  homeRoster: string[],
  awayName: string,
  awayRoster: string[],
  seed: number,
): MatchState {
  return {
    phase: 'pick',
    bout: 1,
    exchange: 0,
    attacker: 'home',
    home: newPlayer(homeName, homeRoster),
    away: newPlayer(awayName, awayRoster),
    seed,
    log: [],
    event: null,
    eventId: 0,
    winner: null,
  };
}

const clone = (s: MatchState): MatchState => structuredClone(s);

const freshFighter = (theme: ThemeDef, cardId: string): Fighter => ({
  cardId,
  hp: theme.match.hp,
  momentum: effectOf(cardOf(theme, cardId), 'startMomentum')?.amount ?? 0,
  lastCalled: null,
  boosts: [],
  abilityUsed: false,
  kickedOut: false,
});

const shortName = (theme: ThemeDef, s: MatchState, side: Side) => cardOf(theme, s[side].active!.cardId).name;

// ---------------------------------------------------------------- actions

export function pick(theme: ThemeDef, state: MatchState, side: Side, cardId: string): MatchState {
  if (!needsPick(state, side)) throw new Error(`${side} cannot pick now`);
  if (!availableToPick(state, side).includes(cardId)) throw new Error(`${cardId} is not available`);
  const s = clone(state);
  s[side].pending = cardId;
  const ready = (['home', 'away'] as Side[]).every((x) => s[x].active || s[x].pending);
  return ready ? reveal(theme, s) : s;
}

function reveal(theme: ThemeDef, s: MatchState): MatchState {
  const rng = new Rng(s.seed);
  const entered: Side[] = [];
  for (const side of ['home', 'away'] as Side[]) {
    if (s[side].pending) {
      s[side].active = freshFighter(theme, s[side].pending!);
      s[side].pending = null;
      entered.push(side);
    }
  }
  const speeds = {
    home: effectiveStat(theme, s, 'home', theme.initiativeStat),
    away: effectiveStat(theme, s, 'away', theme.initiativeStat),
  };
  const coinFlip = speeds.home === speeds.away;
  const initiative: Side = coinFlip ? (rng.next() < 0.5 ? 'home' : 'away') : speeds.home > speeds.away ? 'home' : 'away';
  s.seed = rng.seed;
  s.phase = 'exchange';
  s.exchange = 1;
  s.attacker = initiative;
  const stat = theme.stats.find((x) => x.key === theme.initiativeStat)!.short;
  for (const side of entered)
    s.log.push({ bout: s.bout, tag: `${theme.copy.bout.toUpperCase()} ${s.bout}`, text: `${shortName(theme, s, side)} enters the ring.`, side });
  s.log.push({
    bout: s.bout,
    tag: 'BELL',
    text: coinFlip
      ? `${stat} tied at ${speeds.home} — coin toss: ${shortName(theme, s, initiative)} attacks first.`
      : `${stat} ${Math.max(speeds.home, speeds.away)} vs ${Math.min(speeds.home, speeds.away)} — ${shortName(theme, s, initiative)} attacks first.`,
    side: initiative,
  });
  s.event = { type: 'reveal', entered, initiative, speeds, coinFlip };
  s.eventId++;
  return s;
}

/** Apply damage, kick-outs and ability triggers. Returns KO info. */
function hurt(theme: ThemeDef, s: MatchState, victim: Side, damage: number, allowKickout: boolean) {
  const f = s[victim].active!;
  const card = cardOf(theme, f.cardId);
  const triggers: AbilityTrigger[] = [];
  const fresh: Boost[] = [];
  let kickout: { side: Side; undying: boolean } | null = null;
  let pinned: Side | null = null;
  f.hp -= damage;
  if (f.hp <= 0) {
    const cost = kickoutCost(theme, card);
    if (effectOf(card, 'undying') && !f.abilityUsed) {
      f.hp = 1;
      f.abilityUsed = true;
      kickout = { side: victim, undying: true };
      triggers.push({ side: victim, name: card.ability.name, text: card.ability.text });
    } else if (allowKickout && !f.kickedOut && f.momentum >= cost) {
      f.hp = 1;
      f.momentum -= cost;
      f.kickedOut = true;
      kickout = { side: victim, undying: false };
    } else {
      f.hp = 0;
      pinned = victim;
    }
  }
  const low = effectOf(card, 'boostBelowHp');
  if (!pinned && low && !f.abilityUsed && f.hp < low.threshold) {
    f.abilityUsed = true;
    const boost = { stat: low.stat, amount: low.amount, turns: low.turns };
    f.boosts.push(boost);
    fresh.push(boost);
    triggers.push({ side: victim, name: card.ability.name, text: card.ability.text });
  }
  return { triggers, fresh, kickout, pinned };
}

function endTurn(s: MatchState, fresh: Boost[]) {
  for (const side of ['home', 'away'] as Side[]) {
    const f = s[side].active;
    if (!f) continue;
    f.boosts = f.boosts
      .map((b) => (fresh.includes(b) ? b : { ...b, turns: b.turns - 1 }))
      .filter((b) => b.turns > 0);
  }
  s.attacker = other(s.attacker);
  s.exchange++;
}

function finishBout(theme: ThemeDef, s: MatchState, loser: Side, how: string) {
  const winner = other(loser);
  const lp = s[loser];
  const wp = s[winner];
  const loserName = cardOf(theme, lp.active!.cardId).name;
  const winnerCard = cardOf(theme, wp.active!.cardId);
  lp.eliminated.push(lp.active!.cardId);
  lp.active = null;
  wp.wins++;
  // the winner stays in the ring, keeps HP, resets momentum
  const f = wp.active!;
  f.momentum = effectOf(winnerCard, 'startMomentum')?.amount ?? 0;
  f.lastCalled = null;
  f.boosts = [];
  f.kickedOut = false;
  s.log.push({ bout: s.bout, tag: theme.copy.pin.toUpperCase(), text: `${winnerCard.name} pins ${loserName} ${how}.`, side: winner });
  if (wp.wins >= theme.match.winsNeeded) {
    s.phase = 'matchOver';
    s.winner = winner;
  } else {
    s.phase = 'pick';
    s.bout++;
    s.exchange = 0;
  }
}

export interface CallOptions {
  cheat?: boolean;
}

export function call(theme: ThemeDef, state: MatchState, side: Side, stat: StatKey, opts: CallOptions = {}): MatchState {
  if (state.phase !== 'exchange' || state.attacker !== side) throw new Error(`not ${side}'s turn`);
  if (!callableStats(theme).includes(stat)) throw new Error(`${stat} cannot be called`);
  const me = state[side].active!;
  if (me.lastCalled === stat) throw new Error(`${stat} was called last turn`);
  if (opts.cheat && !canCheat(theme, state, side)) throw new Error('cannot cheat');

  const s = clone(state);
  const def = other(side);
  const atkCard = cardOf(theme, s[side].active!.cardId);
  const values: Record<Side, number> = { home: 0, away: 0 };
  values[side] = effectiveStat(theme, s, side, stat, true);
  values[def] = effectiveStat(theme, s, def, stat);

  let cheat: { caught: boolean; bonus: number } | null = null;
  if (opts.cheat) {
    const rule = tagRule(theme, atkCard, 'cheat')!;
    const caught = cheatCaught(theme, s, side);
    s[side].cheatUsed = true;
    if (caught) {
      s[side].active!.momentum = Math.max(0, s[side].active!.momentum - rule.penalty);
      cheat = { caught: true, bonus: 0 };
    } else {
      values[side] += rule.bonus;
      cheat = { caught: false, bonus: rule.bonus };
    }
  }
  s[side].active!.lastCalled = stat;

  const statShort = theme.stats.find((x) => x.key === stat)!.short;
  let winner: Side;
  let damage = 0;
  let halved = false;
  let res: ReturnType<typeof hurt> = { triggers: [], fresh: [], kickout: null, pinned: null };
  {
    // ties go to the defender, so every exchange moves the match forward
    winner = values.home === values.away ? def : values.home > values.away ? 'home' : 'away';
    const loser = other(winner);
    const margin = Math.abs(values.home - values.away);
    damage = margin + theme.match.baseDamage;
    const chin = effectOf(cardOf(theme, s[loser].active!.cardId), 'ironChin');
    if (chin && margin <= chin.margin) {
      damage = Math.ceil(damage / 2);
      halved = true;
    }
    const wf = s[winner].active!;
    wf.momentum = Math.min(theme.match.maxMomentum, wf.momentum + 1);
    res = hurt(theme, s, loser, damage, true);
  }

  const who = side === 'home' ? 'You call' : `${s.away.name} calls`;
  const cheatText = cheat ? (cheat.caught ? ' Cheat CAUGHT by the ref!' : ` Cheats for +${cheat.bonus}!`) : '';
  s.log.push({
    bout: s.bout,
    tag: `EX ${s.exchange}`,
    text:
      values.home === values.away
        ? `${who} ${statShort} · ${values[side]} vs ${values[def]}. Tie goes to the defender — ${cardOf(theme, s[side].active!.cardId).name} takes ${damage}.${cheatText}`
        : `${who} ${statShort} · ${values[side]} vs ${values[def]}. ${cardOf(theme, s[other(winner)].active!.cardId).name} takes ${damage}${halved ? ' (halved)' : ''}.${cheatText}`,
    side: winner,
  });
  for (const t of res.triggers) s.log.push({ bout: s.bout, tag: 'ABILITY', text: `${t.name}! ${t.text}`, side: t.side });
  if (res.kickout) s.log.push({ bout: s.bout, tag: 'KICK OUT', text: `${cardOf(theme, s[res.kickout.side].active!.cardId).name} kicks out at 2!`, side: res.kickout.side });

  const { triggers, kickout, pinned } = res;
  s.event = { type: 'exchange', attacker: side, stat, values, cheat, winner, damage, halved, triggers, kickout, pinned };
  s.eventId++;
  if (pinned) finishBout(theme, s, pinned, `after a ${statShort} exchange`);
  else endTurn(s, res.fresh);
  return s;
}

export function finisher(theme: ThemeDef, state: MatchState, side: Side): MatchState {
  if (!canFinisher(theme, state, side)) throw new Error('finisher not available');
  const s = clone(state);
  const def = other(side);
  const card = cardOf(theme, s[side].active!.cardId);
  const f = s[side].active!;
  f.momentum -= finisherCost(theme, card);
  f.lastCalled = null;
  const damage = finisherDamage(theme, card);
  const res = hurt(theme, s, def, damage, false);
  s.log.push({
    bout: s.bout,
    tag: theme.copy.finisher.toUpperCase(),
    text: `${card.name} hits the ${card.finisher} for ${damage}!`,
    side,
  });
  for (const t of res.triggers) s.log.push({ bout: s.bout, tag: 'ABILITY', text: `${t.name}! ${t.text}`, side: t.side });
  if (res.kickout) s.log.push({ bout: s.bout, tag: 'KICK OUT', text: `${cardOf(theme, s[def].active!.cardId).name} sits up!`, side: def });
  s.event = { type: 'finisher', attacker: side, name: card.finisher, damage, triggers: res.triggers, kickout: res.kickout, pinned: res.pinned };
  s.eventId++;
  if (res.pinned) finishBout(theme, s, res.pinned, `with the ${card.finisher}`);
  else endTurn(s, res.fresh);
  return s;
}
