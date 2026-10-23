import type { CardDef, StatKey, ThemeDef } from '../../engine/types';
import { rarityOf } from '../../engine/roster';
import { wweTheme } from '../wwe';

// Personal fan project. Superstar names and promo images are (c) WWE.
// Height / weight are billed figures; chest, biceps, titles and years are
// fan estimates for the game, not official numbers.

// height cm, weight kg, chest in, biceps in, titles, years in WWE, finisher rating
type Body = [number, number, number, number, number, number, number];

const BODY: Record<string, Body> = {
  'the-rock': [196, 118, 50, 20, 10, 18, 95],
  undertaker: [208, 140, 52, 21, 7, 30, 97],
  'stone-cold': [188, 114, 50, 19, 10, 10, 98],
  'john-cena': [185, 114, 52, 22, 25, 23, 92],
  'shawn-michaels': [185, 102, 44, 17, 11, 22, 96],
  'rey-mysterio': [168, 79, 40, 16, 12, 23, 88],
  'triple-h': [193, 116, 51, 21, 25, 30, 93],
  kane: [213, 147, 54, 22, 18, 26, 91],
  'randy-orton': [196, 113, 48, 19, 22, 24, 99],
  edge: [196, 109, 46, 18, 31, 20, 94],
  batista: [198, 132, 54, 23, 6, 12, 90],
  'roman-reigns': [191, 120, 52, 21, 11, 14, 94],
  'seth-rollins': [185, 98, 44, 17, 15, 14, 92],
  'cm-punk': [188, 99, 44, 17, 8, 9, 89],
  'brock-lesnar': [191, 130, 56, 24, 10, 15, 96],
  'cody-rhodes': [188, 100, 46, 18, 12, 14, 90],
  'bret-hart': [183, 106, 46, 17, 9, 14, 93],
  'hulk-hogan': [201, 137, 56, 24, 9, 16, 89],
  'ric-flair': [185, 110, 46, 17, 16, 15, 90],
  'randy-savage': [188, 107, 48, 18, 5, 10, 91],
  'andre-the-giant': [224, 236, 64, 26, 2, 15, 85],
  'eddie-guerrero': [173, 100, 44, 17, 7, 5, 88],
  'mick-foley': [188, 130, 50, 18, 11, 12, 84],
  'kurt-angle': [183, 100, 48, 19, 14, 8, 93],
  'aj-styles': [180, 99, 44, 17, 6, 9, 92],
  'becky-lynch': [168, 61, 34, 12, 7, 12, 87],
  'rhea-ripley': [170, 62, 36, 13, 5, 8, 89],
  'charlotte-flair': [178, 68, 36, 13, 14, 12, 90],
  'trish-stratus': [163, 57, 34, 11, 7, 10, 84],
  'bianca-belair': [170, 75, 38, 14, 5, 7, 86],
  'big-show': [213, 175, 60, 24, 11, 20, 88],
  'great-khali': [216, 157, 60, 25, 1, 8, 78],
  'mark-henry': [193, 163, 58, 25, 3, 21, 85],
  goldberg: [193, 129, 54, 23, 3, 7, 95],
  'bobby-lashley': [191, 124, 54, 22, 7, 12, 90],
  'drew-mcintyre': [196, 120, 52, 21, 7, 16, 93],
  'braun-strowman': [203, 175, 58, 23, 4, 10, 86],
  sheamus: [193, 121, 50, 20, 9, 16, 89],
  'kevin-owens': [183, 120, 48, 18, 6, 11, 87],
  'sami-zayn': [185, 96, 42, 16, 5, 12, 85],
  gunther: [193, 125, 52, 20, 3, 6, 91],
  'finn-balor': [180, 86, 42, 16, 5, 11, 88],
  'the-miz': [185, 100, 44, 17, 18, 19, 80],
  'jinder-mahal': [196, 113, 48, 19, 2, 13, 79],
  'ultimate-warrior': [188, 127, 56, 23, 3, 5, 87],
  'daniel-bryan': [173, 95, 42, 16, 9, 12, 89],
  'jey-uso': [188, 109, 46, 18, 10, 15, 87],
  'solo-sikoa': [188, 120, 48, 19, 2, 5, 86],
  'la-knight': [185, 109, 48, 18, 1, 4, 84],
  'bron-breakker': [183, 107, 52, 21, 2, 3, 88],
  'damian-priest': [196, 113, 48, 19, 3, 6, 86],
  'rob-van-dam': [185, 107, 44, 17, 8, 9, 89],
};

const KEYS: StatKey[] = ['hgt', 'wgt', 'chest', 'bicep', 'titles', 'yrs', 'fin'];

// same 52 superstars as the main set, re-rated on body stats
const base = wweTheme.cards.map(({ id, name, nickname, finisher, palette, image, bio }) => ({ id, name, nickname, finisher, palette, image, bio }));

const statsOf = (id: string) => Object.fromEntries(KEYS.map((k, i) => [k, BODY[id][i]]));

// OVR = how often this card's stats beat the rest of the deck, scaled to 60–99
const pctile = (id: string) => {
  const mine = statsOf(id);
  const others = base.filter((c) => c.id !== id).map((c) => statsOf(c.id));
  const beats = KEYS.reduce((sum, k) => sum + others.filter((o) => mine[k] > o[k]).length / others.length, 0);
  return beats / KEYS.length;
};

const cards: CardDef[] = base.map((c, i) => {
  const ovr = Math.round(60 + 39 * pctile(c.id));
  return {
    ...c,
    number: i + 1,
    stats: statsOf(c.id),
    tags: {},
    ability: { name: c.finisher, text: '', effect: { kind: 'finisherDamage', amount: 0 } }, // unused in trump play
    ovr,
    rarity: rarityOf(ovr),
  };
});

export const wweTrumpTheme: ThemeDef = {
  ...wweTheme,
  id: 'wwe-trump',
  name: 'WWE TRUMP CARDS',
  tagline: '52 SUPERSTARS · BODY STATS',
  setName: 'TRUMP CARDS',
  setYear: 'SERIES 1 · 2026',
  printRun: cards.length,
  stats: [
    { key: 'hgt', short: 'HGT', label: 'HEIGHT', unit: 'cm', meaning: 'Billed height in centimetres.' },
    { key: 'wgt', short: 'WGT', label: 'WEIGHT', unit: 'kg', meaning: 'Billed weight in kilograms.' },
    { key: 'chest', short: 'CHEST', label: 'CHEST', unit: 'in', meaning: 'Chest size in inches.' },
    { key: 'bicep', short: 'BICEP', label: 'BICEPS', unit: 'in', meaning: 'Biceps size in inches.' },
    { key: 'titles', short: 'TITLES', label: 'TITLES WON', meaning: 'Championships won in WWE.' },
    { key: 'yrs', short: 'YRS', label: 'EXPERIENCE', unit: 'yrs', meaning: 'Years wrestling in WWE.' },
    { key: 'fin', short: 'FIN', label: 'FINISHER POWER', meaning: 'How devastating the finisher is, out of 100.' },
  ],
  initiativeStat: 'hgt',
  tags: [],
  cards,
};
