import type { CardDef, ThemeDef } from '../../engine/types';
import { ovrOf, rarityOf } from '../../engine/roster';
import { P, ab } from '../kit';

// Personal fan project. Character names and art are (c) their creators.

type Series = keyof typeof SERIES;

const SERIES = {
  JJK: { label: 'JJK', full: 'JUJUTSU KAISEN', color: '#3a2a8a' },
  AOT: { label: 'AOT', full: 'ATTACK ON TITAN', color: '#5a3a1a' },
  OREGAIRU: { label: 'OREGAIRU', full: 'OREGAIRU', color: '#2a6ae0' },
  CHUNI: { label: 'CHUNI', full: 'LOVE, CHUNIBYO & OTHER DELUSIONS', color: '#6a22c0' },
  HORIMIYA: { label: 'HORIMIYA', full: 'HORIMIYA', color: '#c02a5a' },
  TORADORA: { label: 'TORADORA', full: 'TORADORA!', color: '#e0661a' },
  FRIEREN: { label: 'FRIEREN', full: "FRIEREN: BEYOND JOURNEY'S END", color: '#2a8a6a' },
  DRESSUP: { label: 'DRESS-UP', full: 'MY DRESS-UP DARLING', color: '#e02a8a' },
  ANOHANA: { label: 'ANOHANA', full: 'ANOHANA', color: '#4a9ad0' },
  GRANDBLUE: { label: 'G.BLUE', full: 'GRAND BLUE', color: '#0a5ab0' },
  WOTAKOI: { label: 'WOTAKOI', full: 'WOTAKOI', color: '#8a4ac0' },
  SILVERSPOON: { label: 'S.SPOON', full: 'SILVER SPOON', color: '#6a8a1a' },
} as const;

type Raw = Omit<CardDef, 'ovr' | 'rarity' | 'image' | 'number' | 'stats' | 'tags' | 'bio'> & {
  s: [number, number, number, number]; // POW SPD SMT CHM
  series: Series;
  role: 'HERO' | 'ROGUE';
  bio: [string, string]; // height, age
};

const RAW: Raw[] = [
  // Jujutsu Kaisen
  { id: 'yuji', name: 'YUJI ITADORI', nickname: "SUKUNA'S VESSEL", s: [90, 92, 66, 86], series: 'JJK', role: 'HERO', finisher: 'BLACK FLASH', ability: ab.boost('DIVERGENT FIST', 30, 'pow', 15), palette: P.red, bio: ['173 CM', '15'] },
  { id: 'megumi', name: 'MEGUMI FUSHIGURO', nickname: 'TEN SHADOWS', s: [80, 84, 90, 80], series: 'JJK', role: 'HERO', finisher: 'DIVINE DOGS', ability: ab.stat('SHADOW TECHNIQUE', 'smt', 5), palette: P.black, bio: ['175 CM', '15'] },
  { id: 'nobara', name: 'NOBARA KUGISAKI', nickname: 'STRAW DOLL', s: [78, 80, 78, 90], series: 'JJK', role: 'HERO', finisher: 'RESONANCE', ability: ab.chin('COUNTRY GIRL GRIT', 6), palette: P.orange, bio: ['160 CM', '16'] },
  { id: 'gojo', name: 'SATORU GOJO', nickname: 'THE STRONGEST', s: [98, 97, 95, 96], series: 'JJK', role: 'HERO', finisher: 'HOLLOW PURPLE', ability: ab.undying('INFINITY'), palette: P.blue, bio: ['190 CM', '28'] },
  { id: 'sukuna', name: 'RYOMEN SUKUNA', nickname: 'KING OF CURSES', s: [99, 94, 92, 88], series: 'JJK', role: 'ROGUE', finisher: 'MALEVOLENT SHRINE', ability: ab.finDmg('CLEAVE & DISMANTLE', 10), palette: P.red, bio: ['205 CM', '1000+'] },
  { id: 'nanami', name: 'KENTO NANAMI', nickname: 'THE RATIO', s: [86, 80, 90, 88], series: 'JJK', role: 'HERO', finisher: 'RATIO TECHNIQUE', ability: ab.boost('OVERTIME', 40, 'pow', 12), palette: P.gold, bio: ['184 CM', '28'] },
  // Attack on Titan
  { id: 'eren', name: 'EREN YEAGER', nickname: 'THE ATTACK TITAN', s: [92, 82, 74, 84], series: 'AOT', role: 'ROGUE', finisher: 'THE RUMBLING', ability: ab.boost('KEEP MOVING FORWARD', 30, 'pow', 15), palette: P.green, bio: ['183 CM', '19'] },
  { id: 'mikasa', name: 'MIKASA ACKERMAN', nickname: 'THE ACKERMAN', s: [90, 92, 80, 86], series: 'AOT', role: 'HERO', finisher: 'THUNDER SPEAR', ability: ab.stat('ACKERMAN BLOOD', 'spd', 5), palette: P.red, bio: ['176 CM', '19'] },
  { id: 'armin', name: 'ARMIN ARLERT', nickname: 'THE STRATEGIST', s: [62, 70, 98, 86], series: 'AOT', role: 'HERO', finisher: 'COLOSSAL BLAST', ability: ab.stat('GAMBIT', 'smt', 5), palette: P.yellow, bio: ['168 CM', '19'] },
  { id: 'levi', name: 'LEVI ACKERMAN', nickname: "HUMANITY'S STRONGEST", s: [94, 98, 88, 90], series: 'AOT', role: 'HERO', finisher: 'SPINNING SLASH', ability: ab.finCost('ODM MASTERY', 2), palette: P.silver, bio: ['160 CM', '34'] },
  { id: 'erwin', name: 'ERWIN SMITH', nickname: 'THE COMMANDER', s: [80, 74, 96, 94], series: 'AOT', role: 'HERO', finisher: 'FINAL CHARGE', ability: ab.start('DEDICATE YOUR HEARTS', 1), palette: P.blue, bio: ['188 CM', '37'] },
  { id: 'hange', name: 'HANGE ZOË', nickname: 'THE TITAN SCHOLAR', s: [76, 78, 96, 86], series: 'AOT', role: 'HERO', finisher: 'THUNDER SPEARS', ability: ab.stat('SCIENCE!', 'smt', 5), palette: P.teal, bio: ['170 CM', '36'] },
  // Oregairu
  { id: 'hachiman', name: 'HACHIMAN HIKIGAYA', nickname: 'THE LONE WOLF', s: [62, 70, 94, 84], series: 'OREGAIRU', role: 'ROGUE', finisher: 'SELF-SACRIFICE', ability: ab.clean('ROTTEN-FISH EYES'), palette: P.purple, bio: ['175 CM', '17'] },
  { id: 'yukino', name: 'YUKINO YUKINOSHITA', nickname: 'THE ICE QUEEN', s: [66, 76, 96, 90], series: 'OREGAIRU', role: 'HERO', finisher: 'COLD STARE', ability: ab.stat('PERFECT STUDENT', 'smt', 5), palette: P.blue, bio: ['161 CM', '17'] },
  { id: 'yui-yuigahama', name: 'YUI YUIGAHAMA', nickname: 'THE MOOD MAKER', s: [64, 74, 70, 94], series: 'OREGAIRU', role: 'HERO', finisher: 'HOMEMADE COOKIES', ability: ab.boost("EVERYONE'S FRIEND", 40, 'chm', 12), palette: P.pink, bio: ['155 CM', '17'] },
  { id: 'iroha', name: 'IROHA ISSHIKI', nickname: 'THE SLY KOUHAI', s: [60, 80, 86, 92], series: 'OREGAIRU', role: 'ROGUE', finisher: 'KOUHAI CHARM', ability: ab.clean('JUST KIDDING, SENPAI'), palette: P.orange, bio: ['156 CM', '16'] },
  // Love, Chunibyo & Other Delusions
  { id: 'rikka', name: 'RIKKA TAKANASHI', nickname: "WIELDER OF THE TYRANT'S EYE", s: [70, 84, 62, 90], series: 'CHUNI', role: 'HERO', finisher: "TYRANT'S EYE", ability: ab.boost('UNLEASH THE EYE', 30, 'chm', 15), palette: P.purple, bio: ['152 CM', '16'] },
  { id: 'yuta', name: 'YUTA TOGASHI', nickname: 'DARK FLAME MASTER', s: [72, 74, 80, 82], series: 'CHUNI', role: 'HERO', finisher: 'DARK FLAME', ability: ab.kickout('EX-CHUNIBYO', 1), palette: P.black, bio: ['172 CM', '16'] },
  { id: 'shinka', name: 'SHINKA NIBUTANI', nickname: 'THE MORI SUMMER', s: [66, 72, 84, 88], series: 'CHUNI', role: 'ROGUE', finisher: 'PERFECT POISE', ability: ab.clean('FAKE PERFECT GIRL'), palette: P.pink, bio: ['160 CM', '16'] },
  { id: 'dekomori', name: 'SANAE DEKOMORI', nickname: 'MJÖLNIR WIELDER', s: [74, 86, 58, 84], series: 'CHUNI', role: 'ROGUE', finisher: 'MJÖLNIR HAMMER', ability: ab.finDmg('DESU!', 10), palette: P.yellow, bio: ['145 CM', '15'] },
  // Horimiya
  { id: 'hori', name: 'KYOKO HORI', nickname: 'THE SECRET HOMEBODY', s: [74, 78, 86, 92], series: 'HORIMIYA', role: 'HERO', finisher: 'SPIN KICK', ability: ab.start('SECOND FACE', 1), palette: P.red, bio: ['157 CM', '17'] },
  { id: 'miyamura', name: 'IZUMI MIYAMURA', nickname: 'THE HIDDEN PUNK', s: [72, 74, 82, 94], series: 'HORIMIYA', role: 'HERO', finisher: 'NINE PIERCINGS', ability: ab.boost('TATTOOED HEART', 40, 'chm', 12), palette: P.black, bio: ['167 CM', '17'] },
  { id: 'ishikawa', name: 'TORU ISHIKAWA', nickname: 'THE NICE GUY', s: [76, 80, 72, 86], series: 'HORIMIYA', role: 'HERO', finisher: 'FRIENDLY SHOULDER', ability: ab.chin('ALWAYS THERE', 6), palette: P.blue, bio: ['180 CM', '17'] },
  { id: 'yoshikawa', name: 'YUKI YOSHIKAWA', nickname: 'THE CHEERFUL ONE', s: [62, 76, 74, 90], series: 'HORIMIYA', role: 'HERO', finisher: 'SURPRISE HUG', ability: ab.start('SUNNY SMILE', 1), palette: P.yellow, bio: ['150 CM', '17'] },
  // Toradora!
  { id: 'taiga', name: 'TAIGA AISAKA', nickname: 'THE PALMTOP TIGER', s: [88, 90, 70, 88], series: 'TORADORA', role: 'ROGUE', finisher: 'WOODEN SWORD', ability: ab.boost('PALMTOP TIGER', 40, 'pow', 12), palette: P.orange, bio: ['145 CM', '17'] },
  { id: 'ryuji', name: 'RYUJI TAKASU', nickname: 'THE DELINQUENT CHEF', s: [76, 74, 84, 86], series: 'TORADORA', role: 'HERO', finisher: 'PERFECT BENTO', ability: ab.kickout('HOUSEWIFE MODE', 1), palette: P.blue, bio: ['180 CM', '17'] },
  { id: 'ami', name: 'AMI KAWASHIMA', nickname: 'THE MODEL', s: [62, 78, 88, 94], series: 'TORADORA', role: 'ROGUE', finisher: 'MODEL SMILE', ability: ab.clean('TWO-FACED'), palette: P.pink, bio: ['166 CM', '17'] },
  { id: 'minori', name: 'MINORI KUSHIEDA', nickname: 'THE SUNSHINE', s: [82, 88, 72, 90], series: 'TORADORA', role: 'HERO', finisher: 'SOFTBALL SMASH', ability: ab.finCost("PITCHER'S ARM", 2), palette: P.yellow, bio: ['162 CM', '17'] },
  // Frieren
  { id: 'frieren', name: 'FRIEREN', nickname: 'THE SLAYER', s: [94, 78, 98, 84], series: 'FRIEREN', role: 'HERO', finisher: 'ZOLTRAAK', ability: ab.stat('A THOUSAND YEARS OF MAGIC', 'smt', 5), palette: P.silver, bio: ['150 CM', '1000+'] },
  { id: 'fern', name: 'FERN', nickname: 'THE PRODIGY', s: [90, 90, 86, 82], series: 'FRIEREN', role: 'HERO', finisher: 'ZOLTRAAK BARRAGE', ability: ab.finCost('RAPID FIRE', 2), palette: P.purple, bio: ['158 CM', '17'] },
  { id: 'stark', name: 'STARK', nickname: 'THE COWARDLY WARRIOR', s: [94, 80, 62, 82], series: 'FRIEREN', role: 'HERO', finisher: 'LIGHTNING STRIKE', ability: ab.boost('STOP SHAKING', 30, 'pow', 15), palette: P.red, bio: ['180 CM', '18'] },
  { id: 'himmel', name: 'HIMMEL', nickname: 'THE HERO', s: [90, 88, 84, 98], series: 'FRIEREN', role: 'HERO', finisher: "HERO'S SWORD", ability: ab.start('WHAT HIMMEL WOULD DO', 1), palette: P.blue, bio: ['175 CM', '26'] },
  { id: 'eisen', name: 'EISEN', nickname: 'THE WARRIOR DWARF', s: [97, 60, 80, 80], series: 'FRIEREN', role: 'HERO', finisher: 'AXE CLEAVE', ability: ab.chin("DWARF'S HIDE", 10), palette: P.gold, bio: ['130 CM', '300+'] },
  // My Dress-Up Darling
  { id: 'marin', name: 'MARIN KITAGAWA', nickname: 'THE COSPLAY GYARU', s: [70, 82, 74, 98], series: 'DRESSUP', role: 'HERO', finisher: 'FULL COSPLAY', ability: ab.stat('GYARU ENERGY', 'chm', 5), palette: P.pink, bio: ['164 CM', '15'] },
  { id: 'wakana', name: 'WAKANA GOJO', nickname: 'THE HINA DOLL ARTISAN', s: [64, 68, 92, 86], series: 'DRESSUP', role: 'HERO', finisher: 'PERFECT STITCH', ability: ab.stat('MASTER CRAFTSMAN', 'smt', 5), palette: P.teal, bio: ['175 CM', '15'] },
  { id: 'juju', name: 'JUJU INUI', nickname: 'JUJU-SAMA', s: [58, 78, 84, 88], series: 'DRESSUP', role: 'ROGUE', finisher: 'MAGICAL GIRL POSE', ability: ab.clean('PERFECTIONIST'), palette: P.purple, bio: ['142 CM', '17'] },
  // Anohana
  { id: 'jinta', name: 'JINTA YADOMI', nickname: 'JINTAN', s: [70, 72, 80, 86], series: 'ANOHANA', role: 'HERO', finisher: 'SUPER PEACE BUSTERS', ability: ab.kickout('NO MORE HIDING', 1), palette: P.green, bio: ['175 CM', '17'] },
  { id: 'menma', name: 'MEIKO HONMA', nickname: 'MENMA', s: [52, 84, 70, 99], series: 'ANOHANA', role: 'HERO', finisher: 'MENMA FOUND YOU', ability: ab.undying('GHOST OF SUMMER'), palette: P.silver, bio: ['152 CM', '16'] },
  { id: 'anaru', name: 'NARUKO ANJO', nickname: 'ANARU', s: [66, 78, 74, 88], series: 'ANOHANA', role: 'HERO', finisher: 'TOUGH LOVE', ability: ab.chin('TRUE FEELINGS', 6), palette: P.pink, bio: ['160 CM', '17'] },
  { id: 'yukiatsu', name: 'ATSUMU MATSUYUKI', nickname: 'YUKIATSU', s: [74, 80, 90, 82], series: 'ANOHANA', role: 'ROGUE', finisher: 'WHITE DRESS', ability: ab.stat('TOP STUDENT', 'smt', 5), palette: P.blue, bio: ['180 CM', '17'] },
  // Grand Blue
  { id: 'iori', name: 'IORI KITAHARA', nickname: 'THE NAKED DIVER', s: [80, 78, 70, 90], series: 'GRANDBLUE', role: 'ROGUE', finisher: 'SPIRYTUS SHOT', ability: ab.undying('HUNGOVER BUT ALIVE'), palette: P.blue, bio: ['175 CM', '18'] },
  { id: 'kohei', name: 'KOHEI IMAMURA', nickname: 'THE OTAKU', s: [58, 70, 82, 84], series: 'GRANDBLUE', role: 'ROGUE', finisher: 'LALA LOVE', ability: ab.clean('DOUBLE CROSS'), palette: P.yellow, bio: ['174 CM', '18'] },
  { id: 'chisa', name: 'CHISA KOTEGAWA', nickname: 'THE ICE DIVER', s: [70, 82, 84, 90], series: 'GRANDBLUE', role: 'HERO', finisher: 'DEEP DIVE', ability: ab.chin('COLD SHOULDER', 6), palette: P.teal, bio: ['158 CM', '18'] },
  { id: 'kotobuki', name: 'RYUJIRO KOTOBUKI', nickname: 'THE MUSCLE SENPAI', s: [96, 66, 60, 84], series: 'GRANDBLUE', role: 'ROGUE', finisher: 'PEEKABOO DIVE', ability: ab.finDmg('PEEKABOO!', 10), palette: P.orange, bio: ['188 CM', '21'] },
  // Wotakoi
  { id: 'narumi', name: 'NARUMI MOMOSE', nickname: 'THE FUJOSHI', s: [62, 74, 80, 90], series: 'WOTAKOI', role: 'HERO', finisher: 'DOUJIN DROP', ability: ab.boost('SECRET OTAKU', 40, 'chm', 12), palette: P.pink, bio: ['160 CM', '26'] },
  { id: 'hirotaka', name: 'HIROTAKA NIFUJI', nickname: 'THE GAMER', s: [74, 80, 92, 86], series: 'WOTAKOI', role: 'HERO', finisher: 'MAX LEVEL COMBO', ability: ab.finCost('SPEEDRUN', 2), palette: P.black, bio: ['184 CM', '26'] },
  { id: 'hanako', name: 'HANAKO KOYANAGI', nickname: 'THE COSPLAYER', s: [68, 72, 78, 94], series: 'WOTAKOI', role: 'HERO', finisher: 'STAGE ENTRANCE', ability: ab.start('STAGE PRESENCE', 1), palette: P.purple, bio: ['168 CM', '27'] },
  { id: 'kabakura', name: 'TARO KABAKURA', nickname: 'THE TSUNDERE SENIOR', s: [82, 72, 84, 86], series: 'WOTAKOI', role: 'ROGUE', finisher: 'BOSS GLARE', ability: ab.chin('SENIOR STAFF', 6), palette: P.silver, bio: ['182 CM', '28'] },
  // Silver Spoon
  { id: 'hachiken', name: 'YUGO HACHIKEN', nickname: 'THE CITY KID', s: [60, 70, 92, 84], series: 'SILVERSPOON', role: 'HERO', finisher: 'STONE-OVEN PIZZA', ability: ab.kickout('NEVER QUIT', 1), palette: P.green, bio: ['168 CM', '15'] },
  { id: 'aki', name: 'AKI MIKAGE', nickname: 'THE HORSE GIRL', s: [74, 90, 74, 88], series: 'SILVERSPOON', role: 'HERO', finisher: 'SHOW JUMP', ability: ab.stat('EQUESTRIAN', 'spd', 5), palette: P.orange, bio: ['160 CM', '15'] },
  { id: 'komaba', name: 'ICHIRO KOMABA', nickname: 'THE PITCHER', s: [90, 84, 66, 84], series: 'SILVERSPOON', role: 'HERO', finisher: 'FASTBALL', ability: ab.finDmg('KOSHIEN ARM', 10), palette: P.blue, bio: ['180 CM', '15'] },
  { id: 'tamako', name: 'TAMAKO INADA', nickname: 'THE PROFIT QUEEN', s: [66, 62, 94, 82], series: 'SILVERSPOON', role: 'ROGUE', finisher: 'BUSINESS DEAL', ability: ab.clean('SHAREHOLDER'), palette: P.gold, bio: ['155 CM', '15'] },
];

const cards: CardDef[] = RAW.map(({ s, series, role, bio, ...r }, i) => {
  const stats = { pow: s[0], spd: s[1], smt: s[2], chm: s[3] };
  const ovr = ovrOf(stats);
  return {
    ...r,
    number: i + 1,
    image: `${import.meta.env.BASE_URL}cards/anime/${r.id}.webp`,
    stats,
    tags: { series, role },
    bio: { HEIGHT: bio[0], AGE: bio[1], ANIME: SERIES[series].full },
    ovr,
    rarity: rarityOf(ovr),
  };
});

export const animeTheme: ThemeDef = {
  id: 'anime',
  name: 'ANIME CLASH',
  tagline: 'CHARACTERS · SERIES 1',
  league: 'ANIME',
  setName: 'ANIME CLASH',
  setYear: 'SERIES 1 · 2026',
  printRun: 150,
  art: 'portrait',
  stats: [
    { key: 'pow', short: 'POW', label: 'POWER', meaning: 'Fighting strength. Big hits.' },
    { key: 'spd', short: 'SPD', label: 'SPEED', meaning: 'Decides who attacks first.' },
    { key: 'smt', short: 'SMT', label: 'SMARTS', meaning: 'Wits and schemes. Catches cheats.' },
    { key: 'chm', short: 'CHM', label: 'CHARM', meaning: 'Heart and charisma. Wins the crowd.' },
  ],
  initiativeStat: 'spd',
  tags: [
    {
      key: 'series',
      label: 'ANIME',
      synergy: { count: 3, bonus: 2 },
      values: Object.fromEntries(Object.entries(SERIES).map(([k, v]) => [k, { label: v.label, color: v.color, text: '#ffffff' }])),
    },
    {
      key: 'role',
      label: 'ROLE',
      values: {
        ROGUE: {
          label: 'ROGUE',
          color: '#111111',
          text: '#ffe28a',
          rule: { kind: 'cheat', bonus: 10, catchStat: 'smt', penalty: 1 },
          ruleText: 'Pull a trick once per match: +10 to a call. Caught if their SMT is higher: lose 1 Momentum.',
        },
        HERO: {
          label: 'HERO',
          color: '#f2f2f2',
          text: '#111111',
          rule: { kind: 'rally', belowHp: 40, stat: 'chm', amount: 5 },
          ruleText: 'Power of Friendship: below 40 HP, gain +5 CHM.',
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
    ovrCap: 420,
    maxLegendary: 1,
    winsNeeded: 3,
  },
  copy: { fighter: 'Character', bout: 'Battle', finisher: 'Ultimate', pin: 'K.O.' },
};
