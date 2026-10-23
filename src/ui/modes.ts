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
  /** won cards go to a side pile, shuffled in once the deck runs out */
  wonPile: boolean;
  /** stop after every reveal so players can compare all stats */
  pauseAfterReveal: boolean;
  rules: string;
}

export const DECK_MODES: Record<DeckMode, DeckModeDef> = {
  showdown: {
    title: 'SHOWDOWN',
    eyebrow: 'Quick Play',
    theme: DEFAULT_THEME,
    opponents: [1, 2, 3, 4, 5],
    defaultOpponents: 3,
    maxRounds: 60,
    wonPile: false,
    pauseAfterReveal: false,
    rules: 'Winner of each round calls the next stat. Ties go to the pot. Last one holding cards wins.',
  },
  trump: {
    title: 'TRUMP CARDS',
    eyebrow: '52-Card Deck',
    theme: wweTrumpTheme,
    opponents: [1, 2, 3],
    defaultOpponents: 1,
    maxRounds: 1000,
    wonPile: true,
    pauseAfterReveal: true,
    rules:
      'You can only play your top card. The winner calls the next stat and puts the cards on their won pile, which is shuffled in as a new deck once their deck runs out. Ties go to the pot. Win all 52 cards to win.',
  },
};
