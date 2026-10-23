import type { ThemeDef } from '../engine/types';
import { wweTheme } from './wwe';
import { wweTrumpTheme } from './wwe-trump';

export interface ThemeEntry {
  id: string;
  name: string;
  blurb: string;
  theme: ThemeDef | null; // null = announced, not playable yet
  accent: string;
}

/** Every universe the engine can run. Add a theme folder + an entry here. */
export const THEMES: ThemeEntry[] = [
  { id: 'wwe', name: 'WWE LEGENDS', blurb: '52 Superstars · Series 1', theme: wweTheme, accent: '#d0021b' },
  { id: 'wwe-trump', name: 'WWE TRUMP CARDS', blurb: '52 Superstars · Body stats', theme: wweTrumpTheme, accent: '#c99a35' },
  { id: 'football', name: 'FOOTBALL ICONS', blurb: 'Coming soon', theme: null, accent: '#1fa040' },
  { id: 'anime', name: 'ANIME CLASH', blurb: 'Coming soon', theme: null, accent: '#7a2ad0' },
];

export const DEFAULT_THEME = wweTheme;
