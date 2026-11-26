import { useEffect, useRef } from 'react';
import { motionAllowed } from '../utils/motion';
import CognitionField from './CognitionField';

/**
 * 全局环境背景：六层叠加，全部 `position: fixed` + `pointer-events: none`，
 * 只动 transform / opacity，不触发布局。
 *
 * 1. 点阵       22px，26s 漂移一个点距（无缝）
 * 2. 蓝图刻度   88px 细线，96s 反向漂移（与点阵形成视差深度）
 * 3. 蓝光团     44s 缓慢游走 + 17s 呼吸
 * 4. 信号绿光团 58s 反向游走（呼应莱茵那套配色）
 * 5. 扫描带     18s 自上而下过一遍
 * 6. 暗角       静态，把视觉重心压在中间内容区
 *
 * 另加指针视差：整层跟随鼠标做 ±10px 位移，900ms 缓动跟随，触屏与降级模式下不启用。
 */
export default function AmbientBackground({ variant }: { variant?: 'paper' } = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!motionAllowed()) return;
    // 触屏设备不做指针视差（没有“指针位置”这个概念）
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // 变量直写即可：pointermove 本身已按帧合并，配合 CSS 的 900ms 缓动就是阻尼跟随
    const handleMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      el.style.setProperty('--bg-px', x.toFixed(3));
      el.style.setProperty('--bg-py', y.toFixed(3));
    };

    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  return (
    <div className={`app-bg${variant === 'paper' ? ' app-bg--paper' : ''}`} aria-hidden="true" ref={ref}>
      <div className="app-bg__dots" />
      <div className="app-bg__blueprint" />
      <div className="app-bg__glow app-bg__glow--blue" />
      <div className="app-bg__glow app-bg__glow--green" />
      <CognitionField variant={variant} />
      <div className="app-bg__orbit" />
      <div className="app-bg__orbit-arm" />
      <div className="app-bg__orbit-core" />
      <div className="app-bg__vignette" />
    </div>
  );
}
