import type { ThemeDef } from '../engine/types';
import { wweTheme } from './wwe';
import { wweTrumpTheme } from './wwe-trump';
import { animeTheme } from './anime';
import { animeTrumpTheme } from './anime-trump';

export interface Universe {
  id: string;
  name: string;
  blurb: string;
  accent: string;
  /** Match, Showdown and Collection; null = announced, not playable yet */
  theme: ThemeDef | null;
  /** the same cards re-rated for Trump Cards */
  trump: ThemeDef | null;
  /** three card ids fanned out on the home screen, middle one in front */
  featured: string[];
  /** CPU player names for Showdown / Trump Cards */
  bots: string[];
  legal: string;
}

/** Every universe the app can run. Add theme folders + an entry here. */
export const UNIVERSES: Universe[] = [
  {
    id: 'wwe',
    name: 'WWE LEGENDS',
    blurb: '52 Superstars',
    accent: '#d0021b',
    theme: wweTheme,
    trump: wweTrumpTheme,
    featured: ['undertaker', 'the-rock', 'stone-cold'],
    bots: ['DEADMAN_FAN', 'RATTLESNAKE316', 'CENATION', 'HBK_SWEETCHIN', 'MASKED619', 'TRIBAL_CHIEF', 'NATURE_BOY'],
    legal: 'Personal fan project · not affiliated with WWE · Superstar names & images © WWE',
  },
  {
    id: 'anime',
    name: 'ANIME CLASH',
    blurb: '52 Characters',
    accent: '#7a2ad0',
    theme: animeTheme,
    trump: animeTrumpTheme,
    featured: ['levi', 'gojo', 'frieren'],
    bots: ['DOMAIN_EXPANDER', 'TITAN_SHIFTER', 'HIKKI_FAN', 'DARK_FLAME', 'PEEKABOO_CLUB', 'SUPER_PEACE', 'COSPLAY_GYARU'],
    legal: 'Personal fan project · not affiliated with any studio · characters & art © their creators',
  },
  { id: 'football', name: 'FOOTBALL ICONS', blurb: 'Coming soon', accent: '#1fa040', theme: null, trump: null, featured: [], bots: [], legal: '' },
];

export const DEFAULT_UNIVERSE = UNIVERSES[0];
export const DEFAULT_THEME = wweTheme;
