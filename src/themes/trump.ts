import type { CardDef, StatDef, ThemeDef } from '../engine/types';
import { rarityOf } from '../engine/roster';

/**
 * Re-rate a theme's cards on trump-card stats (height, age, …). Each card's
 * values are listed in `stats` order. OVR = how often the card's stats beat
 * the rest of the deck, scaled to 60–99.
 */
export function trumpTheme(
  base: ThemeDef,
  stats: StatDef[],
  values: Record<string, number[]>,
  overrides: Pick<ThemeDef, 'id' | 'name' | 'tagline' | 'setName'>,
): ThemeDef {
  const statsOf = (id: string) => {
    if (!values[id]) throw new Error(`no trump stats for ${id}`);
    return Object.fromEntries(stats.map((s, i) => [s.key, values[id][i]]));
  };
  const all = base.cards.map((c) => ({ id: c.id, stats: statsOf(c.id) }));
  const pctile = (id: string) => {
    const mine = statsOf(id);
    const others = all.filter((c) => c.id !== id);
    const beats = stats.reduce((sum, s) => sum + others.filter((o) => mine[s.key] > o.stats[s.key]).length / others.length, 0);
    return beats / stats.length;
  };

  const cards: CardDef[] = base.cards.map((c) => {
    const ovr = Math.round(60 + 39 * pctile(c.id));
    const { HEIGHT, WEIGHT, HOMETOWN, AGE, ANIME } = c.bio ?? {};
    return {
      ...c,
      stats: statsOf(c.id),
      tags: {},
      bio: Object.fromEntries(Object.entries({ HEIGHT, WEIGHT, AGE, HOMETOWN, ANIME }).filter(([, v]) => v)) as Record<string, string>,
      ovr,
      rarity: rarityOf(ovr),
    };
  });

  return {
    ...base,
    ...overrides,
    printRun: cards.length,
    stats,
    initiativeStat: stats[0].key,
    tags: [],
    cards,
  };
}
