// Theme-agnostic game model. A theme supplies stat names, tag rules and cards;
// the engine only ever deals in stat keys and ability "kinds".

export type StatKey = string;
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface StatDef {
  key: StatKey;
  short: string; // "POW"
  label: string; // "POWER"
  meaning: string; // shown on the rules / stat key
  unit?: string; // "cm", "kg" — shown next to called values
}

/** Card abilities the engine knows how to run. Themes pick and name them. */
export type AbilityEffect =
  | { kind: 'boostBelowHp'; threshold: number; stat: StatKey; amount: number; turns: number }
  | { kind: 'statBoost'; stat: StatKey; amount: number } // when *calling* that stat
  | { kind: 'finisherDamage'; amount: number }
  | { kind: 'finisherCost'; cost: number }
  | { kind: 'startMomentum'; amount: number }
  | { kind: 'ironChin'; margin: number } // lose by <= margin: take half damage
  | { kind: 'undying' } // first pin of the match: survive at 1 HP
  | { kind: 'kickoutDiscount'; cost: number }
  | { kind: 'cleanCheat' }; // cheating is never caught

export interface Ability {
  name: string;
  text: string;
  effect: AbilityEffect;
}

/** Rules attached to a tag value, e.g. alignment HEEL -> cheat. */
export type TagRule =
  | { kind: 'cheat'; bonus: number; catchStat: StatKey; penalty: number }
  | { kind: 'rally'; belowHp: number; stat: StatKey; amount: number };

export interface TagDef {
  key: string; // "brand" | "alignment"
  label: string;
  values: Record<string, { label: string; color: string; text: string; rule?: TagRule; ruleText?: string }>;
  /** N+ roster cards sharing a value of this tag grants +bonus to every stat */
  synergy?: { count: number; bonus: number };
}

export interface CardPalette {
  glow: string; // art window center
  mid: string;
  dark: string;
  plate: string; // nameplate highlight
  plateDark: string;
}

export interface CardDef {
  id: string;
  number: number;
  name: string;
  nickname: string;
  image: string;
  stats: Record<StatKey, number>;
  tags: Record<string, string>;
  finisher: string;
  ability: Ability;
  palette: CardPalette;
  bio?: Record<string, string>;
  // derived
  ovr: number;
  rarity: Rarity;
}

export interface MatchRules {
  hp: number;
  maxMomentum: number;
  finisherCost: number;
  finisherDamage: number;
  baseDamage: number; // added to the stat difference
  kickoutCost: number;
  rosterSize: number;
  ovrCap: number;
  maxLegendary: number;
  winsNeeded: number;
}

export interface ThemeDef {
  id: string;
  name: string;
  tagline: string;
  league: string; // logo text on the card, e.g. "WWE"
  setName: string;
  setYear: string;
  printRun: number;
  /** 'cutout' = transparent promo cut-outs (default); 'portrait' = rectangular character art */
  art?: 'cutout' | 'portrait';
  stats: StatDef[];
  /** stat that decides who attacks first in a bout; not callable in a Match */
  initiativeStat: StatKey;
  tags: TagDef[];
  cards: CardDef[];
  match: MatchRules;
  copy: {
    fighter: string; // "Superstar"
    bout: string; // "Bout"
    finisher: string; // "Finisher"
    pin: string; // "Pinfall"
  };
}
