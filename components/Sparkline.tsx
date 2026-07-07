import { sparklinePoints, toPath } from '@/lib/widgets/series';

export function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = 'var(--emerald)',
  fill = 'var(--leaf)',
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const points = sparklinePoints(values, width, height);
  if (points.length === 0) {
    return <svg width={width} height={height} className={className} aria-hidden="true" />;
  }
  const line = toPath(points);
  // Area path: line + down to baseline + back to start.
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${line} L${last.x},${height} L${first.x},${height} Z`;
  // Rough path length for the draw animation.
  const len = Math.max(width, height) * points.length;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path d={area} fill={fill} fillOpacity={0.16} stroke="none" />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        data-draw=""
        style={{
          strokeDasharray: len,
          ['--len' as string]: `${len}`,
          animation: 'draw 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      />
    </svg>
  );
}
