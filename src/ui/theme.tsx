import { createContext, useContext } from 'react';
import type { ThemeDef } from '../engine/types';
import { DEFAULT_THEME } from '../themes';

export const ThemeContext = createContext<ThemeDef>(DEFAULT_THEME);
export const useTheme = () => useContext(ThemeContext);
export const cardById = (theme: ThemeDef, id: string) => theme.cards.find((c) => c.id === id)!;
