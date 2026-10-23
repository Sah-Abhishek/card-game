import type { ThemeDef } from '../engine/types';
import { DEFAULT_THEME } from '../themes';
import { wweTrumpTheme } from '../themes/wwe-trump';

/** Deal-everything, top-card-only modes. Both run on the Showdown engine. */
export type DeckMode = 'showdown' | 'trump';

export interface DeckModeDef {
  title: string;
  eyebrow: string;
  theme: ThemeDef;
  opponents: number[];
  defaultOpponents: number;
  /** safety cap; at the cap whoever holds the most cards wins */
  maxRounds: number;
  goal: string;
}

export const DECK_MODES: Record<DeckMode, DeckModeDef> = {
  showdown: {
    title: 'SHOWDOWN',
    eyebrow: 'Quick Play',
    theme: DEFAULT_THEME,
    opponents: [1, 2, 3, 4, 5],
    defaultOpponents: 3,
    maxRounds: 60,
    goal: 'Last one holding cards wins.',
  },
  trump: {
    title: 'TRUMP CARDS',
    eyebrow: '52-Card Deck',
    theme: wweTrumpTheme,
    opponents: [1, 2, 3],
    defaultOpponents: 1,
    maxRounds: 1000,
    goal: 'Win every card in the deck to win the game.',
  },
};
