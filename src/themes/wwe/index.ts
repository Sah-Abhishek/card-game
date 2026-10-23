import type { Ability, CardDef, CardPalette, ThemeDef } from '../../engine/types';
import { ovrOf, rarityOf } from '../../engine/roster';

// Personal fan project. Superstar names and promo images are (c) WWE.

const P: Record<string, CardPalette> = {
  red: { glow: '#8a0d16', mid: '#2a0408', dark: '#060102', plate: '#c8001f', plateDark: '#5a0010' },
  purple: { glow: '#4a1a7a', mid: '#1a0630', dark: '#05010a', plate: '#6a22c0', plateDark: '#1a0630' },
  black: { glow: '#4a4a52', mid: '#16161a', dark: '#050505', plate: '#4a4a52', plateDark: '#0a0a0a' },
  green: { glow: '#1a6a2a', mid: '#0a2a10', dark: '#020803', plate: '#1fa040', plateDark: '#0a3a14' },
  pink: { glow: '#7a1a5a', mid: '#2a0620', dark: '#0a0108', plate: '#c02a8a', plateDark: '#3a0628' },
  blue: { glow: '#1a3a8a', mid: '#081a40', dark: '#02050f', plate: '#2a6ae0', plateDark: '#081a40' },
  gold: { glow: '#7a5a10', mid: '#2a1c04', dark: '#0a0702', plate: '#c99a35', plateDark: '#4a3508' },
  orange: { glow: '#8a3a0a', mid: '#2a1004', dark: '#0a0401', plate: '#e0661a', plateDark: '#5a2008' },
  teal: { glow: '#0d5a5a', mid: '#042222', dark: '#010606', plate: '#12a3a3', plateDark: '#063d3d' },
  silver: { glow: '#5a6070', mid: '#1c2028', dark: '#06070a', plate: '#8a95ab', plateDark: '#262b36' },
  yellow: { glow: '#8a7a0a', mid: '#2a2404', dark: '#0a0901', plate: '#e8c21a', plateDark: '#5a4a08' },
};

const ab = {
  boost: (name: string, threshold: number, stat: string, amount: number, turns = 3): Ability => ({
    name,
    text: `Below ${threshold} HP: +${amount} ${stat.toUpperCase()} for ${turns} turns.`,
    effect: { kind: 'boostBelowHp', threshold, stat, amount, turns },
  }),
  stat: (name: string, stat: string, amount: number): Ability => ({
    name,
    text: `+${amount} ${stat.toUpperCase()} whenever this Superstar calls it.`,
    effect: { kind: 'statBoost', stat, amount },
  }),
  finDmg: (name: string, amount: number): Ability => ({
    name,
    text: `Finisher deals +${amount} damage.`,
    effect: { kind: 'finisherDamage', amount },
  }),
  finCost: (name: string, cost: number): Ability => ({
    name,
    text: `Finisher costs only ${cost} Momentum.`,
    effect: { kind: 'finisherCost', cost },
  }),
  start: (name: string, amount: number): Ability => ({
    name,
    text: `Starts every bout with ${amount} Momentum.`,
    effect: { kind: 'startMomentum', amount },
  }),
  chin: (name: string, margin: number): Ability => ({
    name,
    text: `Lose an exchange by ${margin} or less: take half damage.`,
    effect: { kind: 'ironChin', margin },
  }),
  undying: (name: string): Ability => ({
    name,
    text: 'The first time this Superstar would be pinned, they sit up at 1 HP.',
    effect: { kind: 'undying' },
  }),
  kickout: (name: string, cost: number): Ability => ({
    name,
    text: `Kicking out costs only ${cost} Momentum.`,
    effect: { kind: 'kickoutDiscount', cost },
  }),
  clean: (name: string): Ability => ({
    name,
    text: 'Cheats are never caught by the referee.',
    effect: { kind: 'cleanCheat' },
  }),
};

type Raw = Omit<CardDef, 'ovr' | 'rarity' | 'image' | 'number' | 'stats' | 'tags' | 'bio'> & {
  s: [number, number, number, number]; // POW SPD TEC CHA
  brand: 'RAW' | 'SMACKDOWN';
  align: 'FACE' | 'HEEL';
  bio: [string, string, string]; // height, weight, hometown
};

const RAW: Raw[] = [
  { id: 'the-rock', name: 'THE ROCK', nickname: "THE PEOPLE'S CHAMPION", s: [88, 82, 84, 97], brand: 'RAW', align: 'FACE', finisher: 'ROCK BOTTOM', ability: ab.boost("PEOPLE'S CHAMP", 30, 'cha', 15), palette: P.red, bio: [`6'5"`, '260 LBS', 'MIAMI, FL'] },
  { id: 'undertaker', name: 'THE UNDERTAKER', nickname: 'THE DEADMAN', s: [94, 70, 86, 88], brand: 'SMACKDOWN', align: 'HEEL', finisher: 'TOMBSTONE', ability: ab.undying('THE DEADMAN SITS UP'), palette: P.purple, bio: [`6'10"`, '309 LBS', 'DEATH VALLEY'] },
  { id: 'stone-cold', name: 'STONE COLD', nickname: 'THE TEXAS RATTLESNAKE', s: [90, 78, 83, 95], brand: 'RAW', align: 'FACE', finisher: 'STUNNER', ability: ab.finCost('OUTTA NOWHERE STUNNER', 2), palette: P.black, bio: [`6'2"`, '252 LBS', 'VICTORIA, TX'] },
  { id: 'john-cena', name: 'JOHN CENA', nickname: 'THE CHAMP', s: [89, 76, 80, 93], brand: 'RAW', align: 'FACE', finisher: 'ATTITUDE ADJUSTMENT', ability: ab.kickout('NEVER GIVE UP', 1), palette: P.green, bio: [`6'1"`, '251 LBS', 'WEST NEWBURY, MA'] },
  { id: 'shawn-michaels', name: 'SHAWN MICHAELS', nickname: 'THE HEARTBREAK KID', s: [78, 90, 96, 92], brand: 'RAW', align: 'FACE', finisher: 'SWEET CHIN MUSIC', ability: ab.start('MR. WRESTLEMANIA', 1), palette: P.pink, bio: [`6'1"`, '225 LBS', 'SAN ANTONIO, TX'] },
  { id: 'rey-mysterio', name: 'REY MYSTERIO', nickname: 'MASTER OF THE 619', s: [70, 97, 92, 86], brand: 'SMACKDOWN', align: 'FACE', finisher: '619', ability: ab.chin('UNDERDOG', 8), palette: P.blue, bio: [`5'6"`, '175 LBS', 'SAN DIEGO, CA'] },
  { id: 'triple-h', name: 'TRIPLE H', nickname: 'THE GAME', s: [90, 74, 90, 90], brand: 'RAW', align: 'HEEL', finisher: 'PEDIGREE', ability: ab.stat('CEREBRAL ASSASSIN', 'tec', 5), palette: P.silver, bio: [`6'4"`, '255 LBS', 'GREENWICH, CT'] },
  { id: 'kane', name: 'KANE', nickname: 'THE BIG RED MACHINE', s: [95, 68, 78, 80], brand: 'SMACKDOWN', align: 'HEEL', finisher: 'CHOKESLAM', ability: ab.finDmg('HELLFIRE & BRIMSTONE', 10), palette: P.red, bio: [`7'0"`, '323 LBS', 'PARTS UNKNOWN'] },
  { id: 'randy-orton', name: 'RANDY ORTON', nickname: 'THE VIPER', s: [86, 80, 91, 85], brand: 'SMACKDOWN', align: 'HEEL', finisher: 'RKO', ability: ab.finCost('RKO OUTTA NOWHERE', 2), palette: P.teal, bio: [`6'5"`, '250 LBS', 'ST. LOUIS, MO'] },
  { id: 'edge', name: 'EDGE', nickname: 'THE RATED-R SUPERSTAR', s: [84, 84, 86, 88], brand: 'RAW', align: 'HEEL', finisher: 'SPEAR', ability: ab.start('ULTIMATE OPPORTUNIST', 1), palette: P.silver, bio: [`6'5"`, '241 LBS', 'TORONTO, ON'] },
  { id: 'batista', name: 'BATISTA', nickname: 'THE ANIMAL', s: [95, 72, 76, 84], brand: 'RAW', align: 'HEEL', finisher: 'BATISTA BOMB', ability: ab.boost('THE ANIMAL UNLEASHED', 40, 'pow', 12), palette: P.orange, bio: [`6'6"`, '290 LBS', 'WASHINGTON, D.C.'] },
  { id: 'roman-reigns', name: 'ROMAN REIGNS', nickname: 'THE TRIBAL CHIEF', s: [93, 80, 82, 90], brand: 'SMACKDOWN', align: 'HEEL', finisher: 'SPEAR', ability: ab.stat('ACKNOWLEDGE ME', 'pow', 5), palette: P.gold, bio: [`6'3"`, '265 LBS', 'PENSACOLA, FL'] },
  { id: 'seth-rollins', name: 'SETH ROLLINS', nickname: 'THE VISIONARY', s: [82, 90, 92, 88], brand: 'RAW', align: 'FACE', finisher: 'STOMP', ability: ab.stat('THE ARCHITECT', 'tec', 5), palette: P.purple, bio: [`6'1"`, '217 LBS', 'DAVENPORT, IA'] },
  { id: 'cm-punk', name: 'CM PUNK', nickname: 'THE BEST IN THE WORLD', s: [80, 82, 90, 94], brand: 'RAW', align: 'FACE', finisher: 'GO TO SLEEP', ability: ab.stat('PIPEBOMB', 'cha', 5), palette: P.black, bio: [`6'2"`, '218 LBS', 'CHICAGO, IL'] },
  { id: 'brock-lesnar', name: 'BROCK LESNAR', nickname: 'THE BEAST', s: [98, 80, 82, 78], brand: 'RAW', align: 'HEEL', finisher: 'F-5', ability: ab.finDmg('SUPLEX CITY', 10), palette: P.red, bio: [`6'3"`, '286 LBS', 'MINNEAPOLIS, MN'] },
  { id: 'cody-rhodes', name: 'CODY RHODES', nickname: 'THE AMERICAN NIGHTMARE', s: [85, 82, 88, 93], brand: 'SMACKDOWN', align: 'FACE', finisher: 'CROSS RHODES', ability: ab.kickout('FINISH THE STORY', 1), palette: P.blue, bio: [`6'2"`, '220 LBS', 'MARIETTA, GA'] },
  { id: 'bret-hart', name: 'BRET HART', nickname: 'THE HITMAN', s: [78, 80, 98, 86], brand: 'RAW', align: 'FACE', finisher: 'SHARPSHOOTER', ability: ab.stat('EXCELLENCE OF EXECUTION', 'tec', 5), palette: P.pink, bio: [`6'0"`, '234 LBS', 'CALGARY, AB'] },
  { id: 'hulk-hogan', name: 'HULK HOGAN', nickname: 'THE HULKSTER', s: [90, 66, 72, 98], brand: 'SMACKDOWN', align: 'FACE', finisher: 'LEG DROP', ability: ab.boost('HULK UP', 30, 'pow', 15), palette: P.yellow, bio: [`6'7"`, '302 LBS', 'VENICE BEACH, CA'] },
  { id: 'ric-flair', name: 'RIC FLAIR', nickname: 'THE NATURE BOY', s: [74, 72, 90, 96], brand: 'RAW', align: 'HEEL', finisher: 'FIGURE FOUR', ability: ab.clean("STYLIN' & PROFILIN'"), palette: P.gold, bio: [`6'1"`, '243 LBS', 'CHARLOTTE, NC'] },
  { id: 'randy-savage', name: 'RANDY SAVAGE', nickname: 'MACHO MAN', s: [82, 86, 86, 94], brand: 'SMACKDOWN', align: 'FACE', finisher: 'FLYING ELBOW', ability: ab.start('OOOH YEAH!', 1), palette: P.purple, bio: [`6'2"`, '237 LBS', 'SARASOTA, FL'] },
  { id: 'andre-the-giant', name: 'ANDRE THE GIANT', nickname: 'THE EIGHTH WONDER', s: [99, 50, 68, 90], brand: 'SMACKDOWN', align: 'FACE', finisher: 'GIANT SPLASH', ability: ab.chin('IMMOVABLE', 10), palette: P.black, bio: [`7'4"`, '520 LBS', 'GRENOBLE, FRANCE'] },
  { id: 'eddie-guerrero', name: 'EDDIE GUERRERO', nickname: 'LATINO HEAT', s: [76, 90, 92, 90], brand: 'SMACKDOWN', align: 'HEEL', finisher: 'FROG SPLASH', ability: ab.clean('LIE, CHEAT & STEAL'), palette: P.blue, bio: [`5'8"`, '220 LBS', 'EL PASO, TX'] },
  { id: 'mick-foley', name: 'MICK FOLEY', nickname: 'THE HARDCORE LEGEND', s: [84, 68, 78, 88], brand: 'RAW', align: 'FACE', finisher: 'MANDIBLE CLAW', ability: ab.undying('HARDCORE LEGEND'), palette: P.orange, bio: [`6'2"`, '287 LBS', 'LONG ISLAND, NY'] },
  { id: 'kurt-angle', name: 'KURT ANGLE', nickname: 'THE OLYMPIC HERO', s: [84, 80, 96, 88], brand: 'SMACKDOWN', align: 'FACE', finisher: 'ANGLE SLAM', ability: ab.stat("IT'S TRUE!", 'tec', 5), palette: P.gold, bio: [`6'0"`, '220 LBS', 'PITTSBURGH, PA'] },
  { id: 'aj-styles', name: 'AJ STYLES', nickname: 'THE PHENOMENAL ONE', s: [78, 90, 94, 86], brand: 'SMACKDOWN', align: 'FACE', finisher: 'STYLES CLASH', ability: ab.finCost('PHENOMENAL FOREARM', 2), palette: P.silver, bio: [`5'11"`, '218 LBS', 'GAINESVILLE, GA'] },
  { id: 'becky-lynch', name: 'BECKY LYNCH', nickname: 'THE MAN', s: [80, 84, 88, 94], brand: 'RAW', align: 'HEEL', finisher: 'DIS-ARM-HER', ability: ab.boost('THE MAN COMETH', 40, 'tec', 12), palette: P.orange, bio: [`5'6"`, '135 LBS', 'DUBLIN, IRELAND'] },
  { id: 'rhea-ripley', name: 'RHEA RIPLEY', nickname: 'MAMI', s: [90, 80, 84, 90], brand: 'RAW', align: 'HEEL', finisher: 'RIPTIDE', ability: ab.stat("MAMI'S ON TOP", 'pow', 5), palette: P.black, bio: [`5'7"`, '137 LBS', 'ADELAIDE, AUSTRALIA'] },
  { id: 'charlotte-flair', name: 'CHARLOTTE FLAIR', nickname: 'THE QUEEN', s: [84, 82, 90, 92], brand: 'SMACKDOWN', align: 'HEEL', finisher: 'FIGURE EIGHT', ability: ab.start("THE QUEEN'S COURT", 1), palette: P.teal, bio: [`5'10"`, '150 LBS', 'CHARLOTTE, NC'] },
  { id: 'trish-stratus', name: 'TRISH STRATUS', nickname: 'STRATUSFACTION', s: [76, 86, 88, 92], brand: 'RAW', align: 'FACE', finisher: 'CHICK KICK', ability: ab.chin('7-TIME CHAMPION', 6), palette: P.pink, bio: [`5'4"`, '125 LBS', 'TORONTO, ON'] },
  { id: 'bianca-belair', name: 'BIANCA BELAIR', nickname: 'THE EST OF WWE', s: [86, 92, 84, 90], brand: 'SMACKDOWN', align: 'FACE', finisher: 'K.O.D.', ability: ab.boost('ESTEST', 30, 'pow', 15), palette: P.yellow, bio: [`5'7"`, '165 LBS', 'KNOXVILLE, TN'] },
];

const cards: CardDef[] = RAW.map(({ s, brand, align, bio, ...r }, i) => {
  const stats = { pow: s[0], spd: s[1], tec: s[2], cha: s[3] };
  const ovr = ovrOf(stats);
  return {
    ...r,
    number: i + 1,
    image: `${import.meta.env.BASE_URL}cards/wwe/${r.id}.webp`,
    stats,
    tags: { brand, alignment: align },
    bio: { HEIGHT: bio[0], WEIGHT: bio[1], HOMETOWN: bio[2], BRAND: brand },
    ovr,
    rarity: rarityOf(ovr),
  };
});

export const wweTheme: ThemeDef = {
  id: 'wwe',
  name: 'WWE LEGENDS',
  tagline: 'SUPERSTARS · SERIES 1',
  league: 'WWE',
  setName: 'SUPERSTARS',
  setYear: 'SERIES 1 · 2026',
  printRun: 150,
  stats: [
    { key: 'pow', short: 'POW', label: 'POWER', meaning: 'Raw strength. Big hits.' },
    { key: 'spd', short: 'SPD', label: 'SPEED', meaning: 'Decides who attacks first.' },
    { key: 'tec', short: 'TEC', label: 'TECHNIQUE', meaning: 'Holds, counters, skill.' },
    { key: 'cha', short: 'CHA', label: 'CHARISMA', meaning: 'Crowd power. Stops cheats.' },
  ],
  initiativeStat: 'spd',
  tags: [
    {
      key: 'brand',
      label: 'BRAND',
      synergy: { count: 3, bonus: 2 },
      values: {
        RAW: { label: 'RAW', color: '#d0021b', text: '#ffffff' },
        SMACKDOWN: { label: 'SMACKDOWN', color: '#1f4fd1', text: '#ffffff' },
      },
    },
    {
      key: 'alignment',
      label: 'ALIGNMENT',
      values: {
        HEEL: {
          label: 'HEEL',
          color: '#111111',
          text: '#ffe28a',
          rule: { kind: 'cheat', bonus: 10, catchStat: 'cha', penalty: 1 },
          ruleText: 'Cheat once per match: +10 to a call. Caught if their CHA is higher: lose 1 Momentum.',
        },
        FACE: {
          label: 'FACE',
          color: '#f2f2f2',
          text: '#111111',
          rule: { kind: 'rally', belowHp: 40, stat: 'cha', amount: 5 },
          ruleText: 'Crowd Pop: below 40 HP, gain +5 CHA.',
        },
      },
    },
  ],
  cards,
  match: {
    hp: 100,
    maxMomentum: 3,
    finisherCost: 3,
    finisherDamage: 30,
    baseDamage: 10,
    kickoutCost: 2,
    rosterSize: 5,
    ovrCap: 430,
    maxLegendary: 1,
    winsNeeded: 3,
  },
  copy: { fighter: 'Superstar', bout: 'Bout', finisher: 'Finisher', pin: 'Pinfall' },
};
