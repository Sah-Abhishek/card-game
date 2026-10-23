# Arena Legends

A trading card game with a theme-agnostic engine. Two card sets so far, switchable on the home
screen: **WWE Legends** and **Anime Clash** (Jujutsu Kaisen, Attack on Titan, Oregairu, Chunibyo,
Horimiya, Toradora!, Frieren, My Dress-Up Darling, Anohana, Grand Blue, Wotakoi, Silver Spoon).
Every mode works with either set.
Personal, non-commercial fan project — WWE names and promo images are © WWE; anime characters and
art are © their creators.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # engine tests (rules + 600 simulated games)
npm run build
```

## Modes

- **Match** — 1 vs CPU, best of 5 bouts. Build a 5-card roster (OVR ≤ 430, max 1 Legendary),
  trade stat calls, build Momentum, hit Finishers, kick out, pin.
- **Showdown** — 2–6 players (you + bots). The whole deck is shuffled and dealt; the caller picks a
  stat, everyone flips, highest takes all. Ties go to the pot.
- **Trump Cards** — 2–4 players (you + bots), 52-card deck with body stats (height cm, weight kg,
  chest, biceps, titles, years, finisher power). Won cards go to a won pile that is shuffled in
  when your deck runs out; play pauses after each reveal to compare every stat. Win every card to win
  (safety cap of 1000 rounds, then most cards wins). Stats live in `src/themes/wwe-trump/` —
  height/weight are billed figures, the rest are fan estimates.

## Layout

```
src/engine/        pure TypeScript rules — no React
  types.ts         theme/card/ability model
  match.ts         Match rules (bouts, exchanges, finishers, kick-outs, cheats, rallies)
  showdown.ts      Showdown rules
  ai.ts            CPU decisions for both modes
  roster.ts        OVR, rarity, roster cap, auto-pick
src/themes/        one folder per universe
  wwe/index.ts     52 superstars, stats, abilities, tag rules
  wwe-trump/       the same superstars on body stats for Trump Cards
  anime/index.ts   52 anime characters (Match/Showdown stats, HERO/ROGUE, series synergy)
  anime-trump/     the same characters on trump stats (height, age, strength, …)
  kit.ts           shared card palettes + ability makers
  trump.ts         builds a Trump Cards deck from a theme + a stat table
  index.ts         universe registry (locked ones show as "coming soon")
src/ui/            React + framer-motion screens and components
  sfx.ts           synthesised sound effects (Web Audio, no files)
scripts/fetch_wwe_images.py   downloads + crops WWE.com promo cutouts into public/cards/wwe
scripts/fetch_anime_images.py downloads AniList character portraits into public/cards/anime
```

## Adding a theme

1. Create `src/themes/<id>/index.ts` exporting a `ThemeDef`: four stats (one is the
   `initiativeStat`), tags with optional rules (`cheat`, `rally`) and synergy, cards with
   abilities built from the engine's ability kinds, and the match numbers.
2. Put card art in `public/cards/<id>/`.
3. Register it in `src/themes/index.ts`.

The engine and every screen read stat names, copy ("Superstar", "Bout", "Pinfall"), tags and
numbers from the theme, so no UI code changes are needed.
