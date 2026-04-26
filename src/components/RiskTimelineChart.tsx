import { RiskTimeline } from "@/lib/unmapped-types";

interface Props {
  timeline: RiskTimeline;
  level: "low" | "medium" | "high";
}

const LEVEL_STROKE: Record<Props["level"], string> = {
  low: "hsl(var(--risk-low))",
  medium: "hsl(var(--risk-mid))",
  high: "hsl(var(--risk-high))",
};

export const RiskTimelineChart = ({ timeline, level }: Props) => {
  const points = [
    { year: 2025, value: clamp(timeline.y2025) },
    { year: 2027, value: clamp(timeline.y2027) },
    { year: 2030, value: clamp(timeline.y2030) },
  ];

  // SVG geometry
  const W = 320;
  const H = 140;
  const padX = 32;
  const padY = 24;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const x = (i: number) => padX + (i / (points.length - 1)) * innerW;
  const y = (v: number) => padY + (1 - v / 100) * innerH;

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`)
    .join(" ");

  const area = `${path} L ${x(points.length - 1)} ${padY + innerH} L ${x(0)} ${padY + innerH} Z`;
  const stroke = LEVEL_STROKE[level];

  return (
    <figure className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="font-display text-[13px] font-semibold text-foreground">
          Automation risk timeline
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          % at risk
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label="Automation risk projection for 2025, 2027, and 2030"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((g) => (
          <line
            key={g}
            x1={padX}
            x2={W - padX}
            y1={y(g)}
            y2={y(g)}
            stroke="hsl(var(--border))"
            strokeWidth={1}
            strokeDasharray={g === 0 || g === 100 ? "0" : "2 4"}
          />
        ))}

        {/* Y-axis labels */}
        {[0, 50, 100].map((g) => (
          <text
            key={g}
            x={padX - 6}
            y={y(g) + 3}
            textAnchor="end"
            className="fill-muted-foreground"
            style={{ fontSize: 9 }}
          >
            {g}
          </text>
        ))}

        {/* Area under line */}
        <path d={area} fill={stroke} fillOpacity={0.12} />

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Points + value labels */}
        {points.map((p, i) => (
          <g key={p.year}>
            <circle
              cx={x(i)}
              cy={y(p.value)}
              r={4.5}
              fill="hsl(var(--card))"
              stroke={stroke}
              strokeWidth={2.5}
            />
            <text
              x={x(i)}
              y={y(p.value) - 10}
              textAnchor="middle"
              className="fill-foreground"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {Math.round(p.value)}%
            </text>
            <text
              x={x(i)}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground"
              style={{ fontSize: 10 }}
            >
              {p.year}
            </text>
          </g>
        ))}
      </svg>
    </figure>
  );
};

function clamp(n: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}
