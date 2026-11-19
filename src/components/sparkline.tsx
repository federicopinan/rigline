export function Sparkline({
  points,
}: {
  points: { priceCents: number }[];
}) {
  if (points.length < 2) return null;
  const values = points.map((point) => point.priceCents);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const width = 128;
  const height = 40;
  const path = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - 4 - ((value - min) / span) * (height - 8);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const rising = values[values.length - 1] >= values[0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-10 w-32"
      role="img"
      aria-label="Sample price history"
    >
      <path
        d={path}
        fill="none"
        stroke={rising ? "oklch(0.74 0.16 48)" : "oklch(0.78 0.08 190)"}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
