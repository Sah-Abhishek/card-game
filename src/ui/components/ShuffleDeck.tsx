import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CardBack } from './Card';
import { sfx } from '../sfx';

type Phase = 'stack' | 'split' | 'riffle' | 'bridge';

interface Props {
  width: number; // px width of one card
  count?: number; // how many cards to draw (visual only)
  cycles?: number;
  run: boolean;
  onDone?: () => void;
}

/**
 * A riffle shuffle: split into two halves, interleave them back with a
 * cascading drop, square up — repeated a few times, then a bridge.
 */
export function ShuffleDeck({ width, count = 14, cycles = 3, run, onDone }: Props) {
  const [order, setOrder] = useState(() => Array.from({ length: count }, (_, i) => i));
  const [phase, setPhase] = useState<Phase>('stack');
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!run) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    (async () => {
      await wait(250);
      for (let c = 0; c < cycles && !cancelled; c++) {
        setPhase('split');
        sfx.whoosh();
        await wait(380);
        if (cancelled) return;
        // interleave the two halves, a card or two at a time like real thumbs
        setOrder((prev) => {
          const half = Math.ceil(prev.length / 2);
          const left = prev.slice(0, half);
          const right = prev.slice(half);
          const out: number[] = [];
          while (left.length || right.length) {
            const takeL = 1 + (Math.random() < 0.3 ? 1 : 0);
            const takeR = 1 + (Math.random() < 0.3 ? 1 : 0);
            out.push(...left.splice(0, takeL), ...right.splice(0, takeR));
          }
          return out;
        });
        setPhase('riffle');
        sfx.riffle(0.55);
        await wait(720);
        setPhase('stack');
        await wait(180);
      }
      if (cancelled) return;
      setPhase('bridge');
      sfx.riffle(0.4);
      await wait(520);
      setPhase('stack');
      sfx.flick();
      await wait(300);
      if (!cancelled) doneRef.current?.();
    })();
    return () => {
      cancelled = true;
    };
  }, [run, cycles]);

  const half = Math.ceil(count / 2);
  const height = width * 1.4;
  return (
    <div style={{ position: 'relative', width, height }}>
      {Array.from({ length: count }, (_, id) => {
        const pos = order.indexOf(id);
        const inLeft = pos < half;
        const sub = inLeft ? pos : pos - half;
        let target: Record<string, number> = { x: 0, y: -pos * 0.6, rotate: 0, rotateX: 0, scaleY: 1 };
        let delay = 0;
        if (phase === 'split') {
          target = { x: (inLeft ? -1 : 1) * width * 0.58, y: -sub * 0.6 + 6, rotate: inLeft ? -9 : 9, rotateX: 0, scaleY: 1 };
          delay = sub * 0.006;
        } else if (phase === 'riffle') {
          target = { x: 0, y: -pos * 0.6, rotate: 0, rotateX: 0, scaleY: 1 };
          delay = pos * 0.028;
        } else if (phase === 'bridge') {
          target = { x: (inLeft ? -1 : 1) * width * 0.12, y: -pos * 0.6 - 18, rotate: inLeft ? -4 : 4, rotateX: 28, scaleY: 0.94 };
          delay = sub * 0.012;
        }
        return (
          <motion.div
            key={id}
            style={{ position: 'absolute', inset: 0, zIndex: pos, transformPerspective: 800 }}
            animate={target}
            transition={{ type: 'spring', stiffness: 520, damping: 34, delay }}
          >
            <div className="card-root" style={{ width }}>
              <div className="card-face" style={{ position: 'absolute', inset: 0 }}>
                <CardBack />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
