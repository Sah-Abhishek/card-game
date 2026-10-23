import { trumpTheme } from '../trump';
import { animeTheme } from '../anime';

// Personal fan project. Character names and art are (c) their creators.
// Height and age follow the series where known (ageless characters are capped
// at 1000); strength, intelligence, charm, popularity and friends are fan
// ratings for the game.

// height cm, age, strength, intelligence, charm, popularity, close friends
const STATS: Record<string, number[]> = {
  yuji: [173, 15, 92, 60, 85, 90, 12],
  megumi: [175, 15, 82, 88, 80, 88, 6],
  nobara: [160, 16, 76, 74, 86, 84, 8],
  gojo: [190, 28, 99, 95, 97, 99, 5],
  sukuna: [205, 1000, 99, 92, 70, 95, 0],
  nanami: [184, 28, 88, 90, 88, 92, 4],
  eren: [183, 19, 92, 70, 80, 90, 6],
  mikasa: [176, 19, 95, 78, 88, 92, 5],
  armin: [168, 19, 55, 98, 84, 86, 7],
  levi: [160, 34, 98, 86, 90, 97, 4],
  erwin: [188, 37, 80, 96, 92, 89, 6],
  hange: [170, 36, 74, 95, 84, 85, 9],
  hachiman: [175, 17, 55, 92, 72, 88, 2],
  yukino: [161, 17, 58, 96, 88, 86, 2],
  'yui-yuigahama': [155, 17, 52, 64, 92, 82, 20],
  iroha: [156, 16, 50, 84, 90, 83, 15],
  rikka: [152, 16, 60, 58, 88, 85, 4],
  yuta: [172, 16, 64, 76, 76, 70, 6],
  shinka: [160, 16, 56, 80, 86, 74, 10],
  dekomori: [145, 15, 66, 50, 80, 78, 3],
  hori: [157, 17, 70, 84, 92, 86, 12],
  miyamura: [167, 17, 64, 80, 94, 85, 6],
  ishikawa: [180, 17, 74, 70, 84, 72, 18],
  yoshikawa: [150, 17, 52, 72, 88, 70, 16],
  taiga: [145, 17, 85, 70, 87, 92, 3],
  ryuji: [180, 17, 70, 82, 84, 84, 7],
  ami: [166, 17, 52, 86, 95, 82, 6],
  minori: [162, 17, 80, 72, 90, 80, 14],
  frieren: [150, 1000, 94, 98, 82, 96, 4],
  fern: [158, 17, 88, 86, 85, 90, 2],
  stark: [180, 18, 94, 60, 82, 84, 3],
  himmel: [175, 26, 88, 84, 98, 94, 12],
  eisen: [130, 300, 97, 78, 78, 72, 3],
  marin: [164, 15, 60, 70, 98, 95, 20],
  wakana: [175, 15, 62, 88, 86, 87, 3],
  juju: [142, 17, 48, 82, 88, 76, 4],
  jinta: [175, 17, 66, 82, 80, 75, 5],
  menma: [152, 16, 40, 66, 99, 89, 6],
  anaru: [160, 17, 58, 74, 87, 76, 8],
  yukiatsu: [180, 17, 70, 92, 82, 74, 5],
  iori: [175, 18, 78, 66, 82, 84, 10],
  kohei: [174, 18, 50, 80, 74, 80, 9],
  chisa: [158, 18, 66, 84, 90, 78, 6],
  kotobuki: [188, 21, 96, 58, 80, 75, 25],
  narumi: [160, 26, 50, 76, 88, 80, 8],
  hirotaka: [184, 26, 70, 92, 84, 85, 4],
  hanako: [168, 27, 62, 78, 92, 74, 10],
  kabakura: [182, 28, 78, 82, 82, 73, 7],
  hachiken: [168, 15, 54, 94, 78, 72, 15],
  aki: [160, 15, 72, 72, 88, 70, 14],
  komaba: [180, 15, 90, 62, 80, 68, 10],
  tamako: [155, 15, 58, 96, 74, 66, 11],
};

export const animeTrumpTheme = trumpTheme(
  animeTheme,
  [
    { key: 'hgt', short: 'HGT', label: 'HEIGHT', unit: 'cm', meaning: 'Height in centimetres.' },
    { key: 'age', short: 'AGE', label: 'AGE', unit: 'yrs', meaning: 'Age in years. Some have lived a very long time.' },
    { key: 'str', short: 'STR', label: 'STRENGTH', meaning: 'Raw fighting strength, out of 100.' },
    { key: 'iq', short: 'IQ', label: 'INTELLIGENCE', meaning: 'Brains and cunning, out of 100.' },
    { key: 'charm', short: 'CHARM', label: 'CHARM', meaning: 'Charisma and likeability, out of 100.' },
    { key: 'pop', short: 'POP', label: 'POPULARITY', meaning: 'How loved they are by fans, out of 100.' },
    { key: 'friends', short: 'FRNDS', label: 'FRIENDS', meaning: 'Close friends they can count on.' },
  ],
  STATS,
  { id: 'anime-trump', name: 'ANIME TRUMP CARDS', tagline: '52 CHARACTERS · TRUMP STATS', setName: 'TRUMP CARDS' },
);
