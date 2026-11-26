interface RhineMarkProps {
  className?: string;
  /** 开启入场描边、外环旋转与中心脉冲（登录页大标记用） */
  animated?: boolean;
}

/** 莱茵生命风格的六边形标记（纯 SVG，无外部资源） */
export default function RhineMark({ className, animated = false }: RhineMarkProps) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Rhine Lab">
      {animated && (
        <polygon
          className="rhine__mark-rot"
          points="24,0.6 44.2,12.3 44.2,35.7 24,47.4 3.8,35.7 3.8,12.3"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2 5"
          opacity="0.5"
        />
      )}
      <polygon
        className={animated ? 'rhine__mark-draw' : undefined}
        points="24,2.5 43.5,13.25 43.5,34.75 24,45.5 4.5,34.75 4.5,13.25"
        pathLength={animated ? 1 : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <polygon
        points="24,12 36,18.9 36,32.1 24,39 12,32.1 12,18.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.5"
      />
      <line x1="24" y1="2.5" x2="24" y2="12" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <line x1="24" y1="39" x2="24" y2="45.5" stroke="currentColor" strokeWidth="1.1" opacity="0.7" />
      <circle className={animated ? 'rhine__mark-dot' : undefined} cx="24" cy="24" r="2.6" fill="currentColor" />
    </svg>
  );
}
