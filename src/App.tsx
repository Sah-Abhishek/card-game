import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { type PlayableUniverse, ThemeContext, UniverseContext } from './ui/theme';
import { DEFAULT_UNIVERSE, UNIVERSES } from './themes';
import { Home } from './ui/screens/Home';
import { Collection } from './ui/screens/Collection';
import { HowToPlay, type RulesTab } from './ui/screens/HowToPlay';
import { RosterBuilder } from './ui/screens/RosterBuilder';
import { MatchScreen } from './ui/screens/MatchScreen';
import { ShowdownSetup } from './ui/screens/ShowdownSetup';
import { ShowdownScreen } from './ui/screens/ShowdownScreen';
import { DECK_MODES, type DeckMode } from './ui/modes';

export type Route =
  | { name: 'home' }
  | { name: 'collection' }
  | { name: 'rules'; tab?: RulesTab }
  | { name: 'roster' }
  | { name: 'match'; roster: string[] }
  | { name: 'showdownSetup'; mode: DeckMode }
  | { name: 'showdown'; mode: DeckMode; opponents: number };

export type Nav = (r: Route) => void;

const UNIVERSE_KEY = 'arena-legends:universe';

const playable = (id: string | null) => UNIVERSES.find((u) => u.id === id && u.theme && u.trump) as PlayableUniverse | undefined;

function savedUniverse(): PlayableUniverse {
  try {
    return playable(localStorage.getItem(UNIVERSE_KEY)) ?? (DEFAULT_UNIVERSE as PlayableUniverse);
  } catch {
    return DEFAULT_UNIVERSE as PlayableUniverse;
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: 'home' });
  const [universe, setUniverseState] = useState(savedUniverse);
  const setUniverse = (id: string) => {
    const u = playable(id);
    if (!u) return;
    setUniverseState(u);
    try {
      localStorage.setItem(UNIVERSE_KEY, id);
    } catch {
      /* private mode: just don't remember it */
    }
  };
  const [matchKey, setMatchKey] = useState(0);
  const nav: Nav = (r) => {
    setMatchKey((k) => k + 1);
    setRoute(r);
  };

  let screen;
  switch (route.name) {
    case 'home':
      screen = <Home nav={nav} />;
      break;
    case 'collection':
      screen = <Collection nav={nav} />;
      break;
    case 'rules':
      screen = <HowToPlay nav={nav} tab={route.tab} />;
      break;
    case 'roster':
      screen = <RosterBuilder nav={nav} />;
      break;
    case 'match':
      screen = <MatchScreen nav={nav} roster={route.roster} />;
      break;
    case 'showdownSetup':
      screen = <ShowdownSetup nav={nav} mode={route.mode} />;
      break;
    case 'showdown':
      screen = <ShowdownScreen nav={nav} mode={route.mode} opponents={route.opponents} />;
      break;
  }

  return (
    <UniverseContext.Provider value={{ universe, setUniverse }}>
      <ThemeContext.Provider value={'mode' in route && DECK_MODES[route.mode].trumpStats ? universe.trump : universe.theme}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${route.name}-${matchKey}`}
            className="screen"
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25 }}
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </ThemeContext.Provider>
    </UniverseContext.Provider>
  );
}
