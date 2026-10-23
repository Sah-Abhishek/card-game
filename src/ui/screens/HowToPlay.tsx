import { motion } from 'framer-motion';
import type { Nav } from '../../App';
import { Arena, BackButton, MuteButton } from '../components/Arena';
import { useTheme } from '../theme';
import './rules.css';

export function HowToPlay({ nav }: { nav: Nav }) {
  const theme = useTheme();
  const m = theme.match;
  const f = theme.copy.fighter;
  const init = theme.stats.find((s) => s.key === theme.initiativeStat)!;
  const callable = theme.stats.filter((s) => s.key !== theme.initiativeStat).map((s) => s.short);
  const steps = [
    ['BUILD YOUR ROSTER', `Pick ${m.rosterSize} ${f}s. Total OVR must be ${m.ovrCap} or less, with no more than ${m.maxLegendary} Legendary.`],
    ['ENTRANCE', `Both players pick a ${f} face-down, then reveal. Each starts with ${m.hp} HP and 0 Momentum. Higher ${init.short} attacks first.`],
    ['EXCHANGE', `The attacker calls ${callable.join(', ').replace(/, ([^,]*)$/, ' or $1')}. The higher stat deals (difference + ${m.baseDamage}) damage and gains 1 Momentum. Ties go to the defender. Take turns, and never call the same stat twice in a row.`],
    ['FINISHER', `Spend ${m.finisherCost} Momentum to hit your Finisher: ${m.finisherDamage} damage, ignores stats. Drop them to 0 HP with it and it's a pinfall — no kick-outs.`],
    ['KICK OUT', `Dropped to 0 by a normal exchange? Spend ${m.kickoutCost} Momentum to kick out at 1 HP. Once per bout.`],
    ['WIN THE MATCH', `The beaten ${f} is out; the winner stays in the ring and keeps their HP. First to ${m.winsNeeded} bout wins takes the match.`],
  ];
  return (
    <div className="subscreen">
      <Arena ropes={false} />
      <header className="sub-top">
        <BackButton onClick={() => nav({ name: 'home' })} />
        <div className="sub-title">
          <span className="eyebrow">The Match · 2 Players</span>
          <b className="display">HOW TO PLAY</b>
        </div>
        <MuteButton />
      </header>
      <div className="rules scroll">
        <div className="rules-inner">
          {steps.map(([t, d], i) => (
            <motion.div key={t} className="rule" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}>
              <span className="rule-n display">{i + 1}</span>
              <div>
                <b>{t}</b>
                <p>{d}</p>
              </div>
            </motion.div>
          ))}

          <div className="section-title">TAG RULES</div>
          <div className="rule-tags">
            {theme.tags.flatMap((t) =>
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
            {theme.tags
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

          <div className="section-title">STAT KEY</div>
          <div className="rule-stats">
            {theme.stats.map((s) => (
              <div key={s.key} className="panel">
                <b className="display gold-text">{s.short}</b>
                <p>{s.meaning}</p>
              </div>
            ))}
          </div>

          <div className="rule-quick panel">
            <b>⚡ QUICK PLAY: SHOWDOWN</b>
            <p>2–6 players. The whole deck is shuffled and dealt out. The caller picks a stat, everyone flips their top card, and the highest number takes every card. Ties go to the pot. Last one holding cards wins.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
