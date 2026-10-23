import { motion } from 'framer-motion';
import type { CardDef } from '../../engine/types';
import { useTheme } from '../theme';
import './cardinfo.css';

/** The in-app "info view" from the Figma card page: profile, attributes, abilities. */
export function CardInfo({ card }: { card: CardDef }) {
  const theme = useTheme();
  const tagVals = theme.tags.map((t) => ({ t, v: t.values[card.tags[t.key]] })).filter((x) => x.v);
  return (
    <div className="info panel">
      <div className="info-head" style={{ background: `linear-gradient(90deg, ${card.palette.plateDark}, ${card.palette.plate}, ${card.palette.plateDark})` }}>
        <div className="info-shot" style={{ background: `radial-gradient(circle, ${card.palette.glow}, ${card.palette.dark})` }}>
          <img src={card.image} alt="" />
        </div>
        <div className="info-name">
          <b className="display">{card.name}</b>
          <i>“{card.nickname}”</i>
        </div>
        <div className="info-num">
          <b className="display gold-text">#{String(card.number).padStart(3, '0')}</b>
          <small>OF {theme.printRun}</small>
        </div>
      </div>
      <div className="info-body">
        {card.bio && (
          <>
            <div className="section-title">PROFILE</div>
            <div className="info-bio">
              {Object.entries(card.bio).map(([k, v]) => (
                <div key={k}>
                  <small>{k}</small>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="section-title">ATTRIBUTES</div>
        <div className="info-bars">
          {theme.stats.map((s, i) => (
            <div key={s.key} className="info-bar">
              <span>{s.label}</span>
              <div className="info-track">
                <motion.i initial={{ width: 0 }} animate={{ width: `${card.stats[s.key]}%` }} transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: 'easeOut' }} />
              </div>
              <b className="display">{card.stats[s.key]}</b>
            </div>
          ))}
        </div>
        <div className="info-ability">
          <div>
            <small>SPECIAL ABILITY</small>
            <b>{card.ability.name}</b>
          </div>
          <p>{card.ability.text}</p>
        </div>
        <div className="info-tags">
          {tagVals.map(({ t, v }) => (
            <div key={t.key} className="info-tag">
              <span className="tag" style={{ background: v.color, color: v.text }}>
                {v.label}
              </span>
              <p>{v.ruleText ?? (t.synergy ? `${t.synergy.count}+ ${v.label} cards in a roster: +${t.synergy.bonus} to every stat.` : '')}</p>
            </div>
          ))}
          <div className="info-tag">
            <span className="tag" style={{ background: '#ffd23d', color: '#2a1c02' }}>
              FINISHER
            </span>
            <p>{card.finisher}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
