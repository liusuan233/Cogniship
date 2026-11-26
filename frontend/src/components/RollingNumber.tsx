import { useEffect, useRef, useState } from 'react';
import { motionAllowed } from '../utils/motion';

interface RollingNumberProps {
  /** 目标数值 */
  value: number;
  /** 滚动时长（毫秒），默认 900ms——比悬停动效慢一档，像仪表盘归位 */
  duration?: number;
  /** 数字转文本，默认四舍五入后直接显示 */
  format?: (value: number) => string;
  className?: string;
}

/** 与 CSS 里 cubic-bezier(0.2, 0.7, 0.3, 1) 同一调门：起步快、收尾长 */
function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * 数值从 0 滚到目标值（值变化时从当前值继续滚，不回到 0）。
 * 系统开了「减少动态效果」且没有 ?motion=full 时，直接显示终值，不做逐帧更新。
 */
export default function RollingNumber({
  value,
  duration = 900,
  format = (v) => String(Math.round(v)),
  className = '',
}: RollingNumberProps) {
  const allowed = useRef(motionAllowed());
  const [shown, setShown] = useState(() => (motionAllowed() ? 0 : value));
  const current = useRef(shown);

  useEffect(() => {
    if (!allowed.current) {
      current.current = value;
      setShown(value);
      return;
    }

    const from = current.current;
    if (from === value) {
      setShown(value);
      return;
    }

    let frame = 0;
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const next = from + (value - from) * easeOut(progress);
      current.current = next;
      setShown(next);
      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        current.current = value;
        setShown(value);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return (
    <span className={`rolling-number tabular-nums ${className}`.trim()}>{format(shown)}</span>
  );
}
