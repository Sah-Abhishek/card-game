import type { Ability, CardPalette } from '../engine/types';

// Shared building blocks for themes: card colour palettes and ability makers.

export const P: Record<string, CardPalette> = {
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

export const ab = {
  boost: (name: string, threshold: number, stat: string, amount: number, turns = 3): Ability => ({
    name,
    text: `Below ${threshold} HP: +${amount} ${stat.toUpperCase()} for ${turns} turns.`,
    effect: { kind: 'boostBelowHp', threshold, stat, amount, turns },
  }),
  stat: (name: string, stat: string, amount: number): Ability => ({
    name,
    text: `+${amount} ${stat.toUpperCase()} whenever this card calls it.`,
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
    text: 'The first time this card would be pinned, they get up at 1 HP.',
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
