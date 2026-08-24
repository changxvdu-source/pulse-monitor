export function ResponseChart(props: {
  series: { at: number; responseMs: number }[];
  emptyLabel: string;
  label: string;
}) {
  if (props.series.length === 0) {
    return <p className="text-sm text-zinc-500">{props.emptyLabel}</p>;
  }

  const width = 480;
  const height = 96;
  const pad = 8;
  const values = props.series.map((point) => point.responseMs);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const last = Math.max(1, props.series.length - 1);
  const points = props.series
    .map((point, index) => {
      const x = pad + (index / last) * (width - 2 * pad);
      const y =
        height - pad - ((point.responseMs - min) / range) * (height - 2 * pad);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-24 w-full text-emerald-700"
      role="img"
      aria-label={props.label}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}
