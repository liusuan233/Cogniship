/** 莱茵生命风格的六边形标记（纯 SVG，无外部资源） */
export default function RhineMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" role="img" aria-label="Rhine Lab">
      <polygon
        points="24,2.5 43.5,13.25 43.5,34.75 24,45.5 4.5,34.75 4.5,13.25"
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
      <circle cx="24" cy="24" r="2.6" fill="currentColor" />
    </svg>
  );
}
