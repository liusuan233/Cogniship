/**
 * 是否允许播放动效。
 * html[data-motion="full"]（默认）→ 放行；
 * html[data-motion="off"]        → 关闭；
 * 未设置（?motion=system）       → 跟随系统「减少动态效果」。
 */
export function motionAllowed(): boolean {
  if (typeof document === 'undefined') return false;
  const flag = document.documentElement.dataset.motion;
  if (flag === 'full') return true;
  if (flag === 'off') return false;
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
