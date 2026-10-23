import { createContext, useContext } from 'react';
import type { ThemeDef } from '../engine/types';
import { DEFAULT_THEME, DEFAULT_UNIVERSE, type Universe } from '../themes';

export const ThemeContext = createContext<ThemeDef>(DEFAULT_THEME);
export const useTheme = () => useContext(ThemeContext);
export const cardById = (theme: ThemeDef, id: string) => theme.cards.find((c) => c.id === id)!;

export type PlayableUniverse = Universe & { theme: ThemeDef; trump: ThemeDef };

/** Which set of cards (WWE, anime…) every mode is currently using. */
export const UniverseContext = createContext<{ universe: PlayableUniverse; setUniverse: (id: string) => void }>({
  universe: DEFAULT_UNIVERSE as PlayableUniverse,
  setUniverse: () => {},
});
export const useUniverse = () => useContext(UniverseContext);
