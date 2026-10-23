import type { CardDef, Rarity, StatKey, ThemeDef } from './types';
import { Rng } from './rng';

export const ovrOf = (stats: Record<StatKey, number>) => {
  const vals = Object.values(stats);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

export const rarityOf = (ovr: number): Rarity =>
  ovr >= 88 ? 'legendary' : ovr >= 85 ? 'epic' : ovr >= 80 ? 'rare' : 'common';

export const RARITY_LABEL: Record<Rarity, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
};

export interface RosterCheck {
  ok: boolean;
  totalOvr: number;
  legendaries: number;
  problems: string[];
}

export function checkRoster(theme: ThemeDef, cards: CardDef[]): RosterCheck {
  const { rosterSize, ovrCap, maxLegendary } = theme.match;
  const totalOvr = cards.reduce((s, c) => s + c.ovr, 0);
  const legendaries = cards.filter((c) => c.rarity === 'legendary').length;
  const problems: string[] = [];
  if (cards.length !== rosterSize) problems.push(`Pick ${rosterSize} ${theme.copy.fighter}s`);
  if (totalOvr > ovrCap) problems.push(`Total OVR ${totalOvr} is over the ${ovrCap} cap`);
  if (legendaries > maxLegendary) problems.push(`Only ${maxLegendary} Legendary allowed`);
  return { ok: problems.length === 0, totalOvr, legendaries, problems };
}

/** Can `card` still be added to `picked` without breaking the cap? */
export function canAdd(theme: ThemeDef, picked: CardDef[], card: CardDef): boolean {
  const { rosterSize, ovrCap, maxLegendary } = theme.match;
  if (picked.length >= rosterSize || picked.some((c) => c.id === card.id)) return false;
  if (card.rarity === 'legendary' && picked.filter((c) => c.rarity === 'legendary').length >= maxLegendary)
    return false;
  // leave room for the cheapest cards that could fill the remaining slots
  const rest = theme.cards
    .filter((c) => c.id !== card.id && !picked.some((p) => p.id === c.id))
    .map((c) => c.ovr)
    .sort((a, b) => a - b)
    .slice(0, rosterSize - picked.length - 1);
  const floor = picked.reduce((s, c) => s + c.ovr, 0) + card.ovr + rest.reduce((s, v) => s + v, 0);
  return floor <= ovrCap;
}

/** Strongest-feeling valid roster: random order, greedily kept under the cap. */
export function autoRoster(theme: ThemeDef, rng: Rng, exclude: string[] = []): CardDef[] {
  for (let attempt = 0; attempt < 200; attempt++) {
    const pool = rng.shuffle(theme.cards.filter((c) => !exclude.includes(c.id)));
    const picked: CardDef[] = [];
    for (const card of pool) if (canAdd(theme, picked, card)) picked.push(card);
    if (checkRoster(theme, picked).ok) return picked;
  }
  throw new Error('could not build a valid roster');
}

/** Tag synergy bonus (e.g. 3+ RAW cards => +2 all stats). */
export function synergyBonus(theme: ThemeDef, roster: CardDef[], card: CardDef): number {
  let bonus = 0;
  for (const tag of theme.tags) {
    if (!tag.synergy) continue;
    const value = card.tags[tag.key];
    const count = roster.filter((c) => c.tags[tag.key] === value).length;
    if (count >= tag.synergy.count) bonus += tag.synergy.bonus;
  }
  return bonus;
}
