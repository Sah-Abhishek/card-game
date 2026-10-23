import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Nav } from '../../App';
import type { ThemeDef } from '../../engine/types';
import { Arena, BackButton, MuteButton } from '../components/Arena';
import { useTheme, useUniverse } from '../theme';
import { DECK_MODES, type DeckModeDef } from '../modes';
import { sfx } from '../sfx';
import './rules.css';

export type RulesTab = 'match' | 'showdown' | 'trump';

const TABS: { id: RulesTab; label: string; sub: string }[] = [
  { id: 'match', label: 'MATCH', sub: '1 vs 1' },
  { id: 'showdown', label: 'SHOWDOWN', sub: '2–6 players' },
  { id: 'trump', label: 'TRUMP CARDS', sub: '2–4 players' },
];

type Step = [title: string, text: string];

const list = (items: string[]) => items.join(', ').replace(/, ([^,]*)$/, ' or $1');

const playerRange = (def: DeckModeDef) => `${Math.min(...def.opponents) + 1}–${Math.max(...def.opponents) + 1}`;

/** "26, 17 or 13 cards each" for every table size the mode allows */
const handSizes = (def: DeckModeDef, theme: ThemeDef) =>
  list(def.opponents.map((o) => String(Math.floor(theme.cards.length / (o + 1))))) + ' cards each';

function matchSteps(theme: ThemeDef): Step[] {
  const m = theme.match;
  const f = theme.copy.fighter;
  const init = theme.stats.find((s) => s.key === theme.initiativeStat)!;
  const callable = theme.stats.filter((s) => s.key !== theme.initiativeStat).map((s) => s.short);
  return [
    ['BUILD YOUR ROSTER', `Pick ${m.rosterSize} ${f}s. Total OVR must be ${m.ovrCap} or less, with no more than ${m.maxLegendary} Legendary.`],
    ['ENTRANCE', `Both players pick a ${f} face-down, then reveal. Each starts with ${m.hp} HP and 0 Momentum. Higher ${init.short} attacks first.`],
    ['EXCHANGE', `The attacker calls ${list(callable)}. The higher stat deals (difference + ${m.baseDamage}) damage and gains 1 Momentum. Ties go to the defender. Take turns, and never call the same stat twice in a row.`],
    ['FINISHER', `Spend ${m.finisherCost} Momentum to hit your Finisher: ${m.finisherDamage} damage, ignores stats. Drop them to 0 HP with it and it's a pinfall — no kick-outs.`],
    ['KICK OUT', `Dropped to 0 by a normal exchange? Spend ${m.kickoutCost} Momentum to kick out at 1 HP. Once per bout.`],
    ['WIN THE MATCH', `The beaten ${f} is out; the winner stays in the ring and keeps their HP. First to ${m.winsNeeded} bout wins takes the match.`],
  ];
}

function showdownSteps(def: DeckModeDef, theme: ThemeDef): Step[] {
  const stats = theme.stats.map((s) => s.short);
  return [
    ['SHUFFLE & DEAL', `${playerRange(def)} players — you against CPU bots. All ${theme.cards.length} cards are shuffled and dealt out evenly. Leftover cards start in the pot.`],
    ['TOP CARD ONLY', 'Keep your pile face-down. You only ever see and play the card on top — no picking.'],
    ['CALL A STAT', `The caller picks ${list(stats)} from their top card. Whoever calls first is random.`],
    ['FLIP & COMPARE', 'Everyone flips their top card. Highest number for that stat takes every card on the table and tucks them under their pile. The winner calls next.'],
    ['TIES', 'If the top number is tied, all the flipped cards go to the pot. The next round winner takes the pot too.'],
    ['WIN', `Run out of cards and you're out. Last player holding cards wins. After ${def.maxRounds} rounds, most cards wins.`],
  ];
}

function trumpSteps(def: DeckModeDef, theme: ThemeDef): Step[] {
  const stats = theme.stats.map((s) => s.label.toLowerCase());
  const n = theme.cards.length;
  return [
    ['SHUFFLE & DEAL', `${playerRange(def)} players — you against CPU bots. The ${n}-card deck is shuffled and dealt out evenly: ${handSizes(def, theme)}. Any leftover card starts in the pot.`],
    ['TOP CARD ONLY', "Your deck stays face-down. You can only play the card on top — you can't choose a different one."],
    ['CALL A STAT', `The caller reads one stat off their top card: ${list(stats)}. Whoever calls first is random.`],
    ['FLIP & COMPARE', 'Everyone flips their top card and the called stat is compared. Higher number wins every card on the table, and the winner calls next.'],
    ['STOP & CHECK', 'After every turn the game pauses on a table of every stat on every flipped card, so you can see how the cards stack up. Tap NEXT ROUND (or press Space) to carry on.'],
    ['WON PILE', 'Cards you win go onto your won pile, not your deck. When your deck runs out, your won pile is shuffled and becomes your new deck.'],
    ['TIES', 'A tie on the called stat sends all the flipped cards to the pot. The next round winner takes the pot as well.'],
    ['WIN', `With no cards in your deck or won pile, you're out. Collect all ${n} cards to win. (After ${def.maxRounds} rounds, most cards wins.)`],
  ];
}

const TIPS: Record<RulesTab, string> = {
  match: "Save Momentum for a Finisher when they're low — or for a kick-out when you are.",
  showdown: 'Call the stat your card is best at compared with the whole deck, not just its highest number.',
  trump: 'The biggest card wins on height, but a smaller one can steal it on brains, charm or experience. Call where your card stands out.',
};

export function HowToPlay({ nav, tab: initial = 'match' }: { nav: Nav; tab?: RulesTab }) {
  const main = useTheme();
  const { universe } = useUniverse();
  const [tab, setTab] = useState<RulesTab>(initial);
  const steps = tab === 'match' ? matchSteps(main) : tab === 'showdown' ? showdownSteps(DECK_MODES.showdown, main) : trumpSteps(DECK_MODES.trump, universe.trump);
  const statTheme = tab === 'trump' ? universe.trump : main;

  return (
    <div className="subscreen">
      <Arena ropes={false} />
      <header className="sub-top">
        <BackButton onClick={() => nav({ name: 'home' })} />
        <div className="sub-title">
          <span className="eyebrow">{universe.name}</span>
          <b className="display">HOW TO PLAY</b>
        </div>
        <MuteButton />
      </header>
      <div className="rules scroll">
        <div className="rules-inner">
          <div className="rules-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`rules-tab ${tab === t.id ? 'on' : ''}`}
                onClick={() => {
                  sfx.flick();
                  setTab(t.id);
                }}
              >
                <b className="display">{t.label}</b>
                <small>{t.sub}</small>
              </button>
            ))}
          </div>

          {steps.map(([t, d], i) => (
            <motion.div key={`${tab}-${t}`} className="rule" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <span className="rule-n display">{i + 1}</span>
              <div>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            </motion.div>
          ))}

          {tab === 'match' && (
            <>
              <div className="section-title">TAG RULES</div>
              <div className="rule-tags">
                {main.tags.flatMap((t) =>
                  Object.values(t.values)
                    .filter((v) => v.ruleText)
                    .map((v) => (
                      <div key={v.label} className="rule-tag panel">
                        <span className="tag" style={{ background: v.color, color: v.text }}>
                          {v.label}
                        </span>
                        <p>{v.ruleText}</p>
                      </div>
                    )),
                )}
                {main.tags
                  .filter((t) => t.synergy)
                  .map((t) => (
                    <div key={t.key} className="rule-tag panel">
                      <span className="tag" style={{ background: '#d0021b', color: '#fff' }}>
                        {t.label}
                      </span>
                      <p>
                        {t.synergy!.count}+ cards from one {t.label.toLowerCase()} in your roster: +{t.synergy!.bonus} to every stat.
                      </p>
                    </div>
                  ))}
              </div>
            </>
          )}

          <div className="section-title">STAT KEY</div>
          <div className="rule-stats">
            {statTheme.stats.map((s) => (
              <div key={s.key} className="panel">
                <b className="display gold-text">{s.short}</b>
                <p>{s.meaning}</p>
              </div>
            ))}
          </div>

          <div className="rule-quick panel">
            <b>💡 TIP</b>
            <p>{TIPS[tab]}</p>
          </div>

          <button
            className="btn btn-gold rules-play"
            onClick={() => {
              sfx.select();
              nav(tab === 'match' ? { name: 'roster' } : { name: 'showdownSetup', mode: tab });
            }}
          >
            Play {TABS.find((t) => t.id === tab)!.label}
          </button>
        </div>
      </div>
    </div>
  );
}
