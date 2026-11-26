import { useEffect, useRef } from 'react';
import { motionAllowed } from '../utils/motion';

/**
 * 认知拓扑（cognition field）
 * —— 背景里那张会自己"接线"的网：节点缓慢漂移，够近就连一条极细的边，
 *    时不时有一道信号沿边跑过去。视觉语言：仪器的观测场，不是粒子的装饰。
 *
 * 约束：
 * - 种子固定 → 每次刷新是同一张拓扑，稳定、不"抽卡"；
 * - 只画 1px 线与 1~2px 点，透明度很低，永远不抢正文；
 * - 首帧同步绘制（哪怕 rAF 被节流也有东西看）；
 * - 「减少动态效果」下只留静态一帧，不再跑 rAF、不跑信号。
 */

type Palette = {
  line: string; // rgb 三元组，透明度在绘制时算
  node: string;
  hub: string;
  signal: string;
};

const PALETTES: Record<'app' | 'paper', Palette> = {
  app: { line: '37, 99, 235', node: 'rgba(37, 99, 235, 0.4)', hub: 'rgba(141, 198, 63, 0.75)', signal: 'rgba(141, 198, 63, 0.95)' },
  paper: { line: '16, 21, 15', node: 'rgba(16, 21, 15, 0.34)', hub: 'rgba(93, 138, 31, 0.8)', signal: 'rgba(93, 138, 31, 0.95)' },
};

const LINK_DIST = 150; // 连边阈值（px）
const MOUSE_RADIUS = 200; // 指针吸附半径
const MOUSE_PULL = 14; // 最大位移（px）

type Node = { x: number; y: number; vx: number; vy: number; hub: boolean; r: number };
type Signal = { a: number; b: number; t: number; speed: number };

function makeRandom(seed: number) {
  let s = seed % 4294967296;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export default function CognitionField({ variant = 'app' }: { variant?: 'app' | 'paper' }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = PALETTES[variant];
    const animate = motionAllowed();
    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let signals: Signal[] = [];
    let raf = 0;
    let last = 0;
    let nextSignalIn = 900;
    let pointerX = -9999;
    let pointerY = -9999;

    /** 节点数随视口走：小屏稀疏，大屏也不过密 */
    const nodeCount = () => Math.round(Math.min(56, Math.max(16, (width * height) / 34000)));

    const seedField = () => {
      const rnd = makeRandom(20261126);
      const count = nodeCount();
      nodes = Array.from({ length: count }, (_, i) => ({
        x: rnd() * width,
        y: rnd() * height,
        vx: (rnd() - 0.5) * 13, // px/s
        vy: (rnd() - 0.5) * 13,
        hub: i % 9 === 0,
        r: 1.1 + rnd() * 0.7,
      }));
      signals = [];
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedField();
    };

    const nodePos = (n: Node) => {
      // 指针吸附：只在绘制时偏移，不改变物理位置，松手即回
      const dx = pointerX - n.x;
      const dy = pointerY - n.y;
      const d = Math.hypot(dx, dy);
      if (d > MOUSE_RADIUS || d < 1) return { x: n.x, y: n.y };
      const k = (1 - d / MOUSE_RADIUS) * MOUSE_PULL;
      return { x: n.x + (dx / d) * k, y: n.y + (dy / d) * k };
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const pos = nodes.map(nodePos);

      // —— 边：距离越近越实，超出阈值直接不画 ——
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const dx = pos[i].x - pos[j].x;
          const dy = pos[i].y - pos[j].y;
          const d = Math.hypot(dx, dy);
          if (d > LINK_DIST) continue;
          const near = 1 - d / LINK_DIST;
          const alpha = near * near * (nodes[i].hub || nodes[j].hub ? 0.26 : 0.16);
          ctx.strokeStyle = `rgba(${palette.line}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pos[i].x, pos[i].y);
          ctx.lineTo(pos[j].x, pos[j].y);
          ctx.stroke();
        }
      }

      // —— 信号：沿某条边跑过去，尾部带一小段拖影 ——
      signals.forEach((sig) => {
        const a = pos[sig.a];
        const b = pos[sig.b];
        const x = a.x + (b.x - a.x) * sig.t;
        const y = a.y + (b.y - a.y) * sig.t;
        const tailX = a.x + (b.x - a.x) * Math.max(0, sig.t - 0.12);
        const tailY = a.y + (b.y - a.y) * Math.max(0, sig.t - 0.12);
        const grad = ctx.createLinearGradient(tailX, tailY, x, y);
        grad.addColorStop(0, 'rgba(141, 198, 63, 0)');
        grad.addColorStop(1, palette.signal);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = palette.signal;
        ctx.beginPath();
        ctx.arc(x, y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });

      // —— 节点：hub 带一圈呼吸光晕 ——
      const pulse = animate ? 0.5 + 0.5 * Math.sin(time / 1700) : 0.7;
      nodes.forEach((n, i) => {
        const p = pos[i];
        if (n.hub) {
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
          halo.addColorStop(0, `rgba(141, 198, 63, ${(0.16 + pulse * 0.14).toFixed(3)})`);
          halo.addColorStop(1, 'rgba(141, 198, 63, 0)');
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = n.hub ? palette.hub : palette.node;
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.hub ? n.r + 0.6 : n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const step = (time: number) => {
      const dt = last ? Math.min(0.05, (time - last) / 1000) : 0;
      last = time;

      nodes.forEach((n) => {
        n.x += n.vx * dt;
        n.y += n.vy * dt;
        if (n.x < -20) n.x = width + 20;
        if (n.x > width + 20) n.x = -20;
        if (n.y < -20) n.y = height + 20;
        if (n.y > height + 20) n.y = -20;
      });

      // 信号：约每 1.6~3.4s 挑一条"当下真的连得上"的边
      nextSignalIn -= dt * 1000;
      if (nextSignalIn <= 0) {
        nextSignalIn = 1600 + Math.random() * 1800;
        const cand: Array<[number, number]> = [];
        for (let i = 0; i < nodes.length; i += 1) {
          for (let j = i + 1; j < nodes.length; j += 1) {
            if (Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y) < LINK_DIST * 0.8) cand.push([i, j]);
          }
        }
        if (cand.length) {
          const [a, b] = cand[Math.floor(Math.random() * cand.length)];
          signals.push({ a, b, t: 0, speed: 0.55 + Math.random() * 0.35 });
        }
      }
      signals = signals.filter((s) => {
        s.t += s.speed * dt;
        return s.t < 1;
      });

      draw(time);
      raf = requestAnimationFrame(step);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      last = 0;
      raf = requestAnimationFrame(step);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerX = event.clientX - rect.left;
      pointerY = event.clientY - rect.top;
    };

    const onPointerLeave = () => {
      pointerX = -9999;
      pointerY = -9999;
    };

    resize();
    draw(0); // 首帧同步落地：rAF 被节流也有一张完整的场

    const onResize = () => {
      resize();
      draw(performance.now());
    };

    window.addEventListener('resize', onResize);

    if (animate) {
      start();
      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerout', onPointerLeave, { passive: true });
    }

    // 系统在运行中切换「减少动态效果」时，停下来/接着跑
    const onReduceChange = () => {
      if (reduceQuery.matches && document.documentElement.dataset.motion !== 'full') {
        cancelAnimationFrame(raf);
      } else {
        start();
      }
    };
    reduceQuery.addEventListener('change', onReduceChange);

    // 后台标签页不烧 CPU
    const onVisible = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else if (animate) start();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerout', onPointerLeave);
      reduceQuery.removeEventListener('change', onReduceChange);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [variant]);

  return <canvas className="app-bg__field" ref={ref} aria-hidden="true" />;
}
