export function ResponseChart(props: {
  series: { at: number; responseMs: number }[];
  emptyLabel: string;
  label: string;
  lastLabel: string;
}) {
  if (props.series.length === 0) {
    return <p className="text-sm text-zinc-500">{props.emptyLabel}</p>;
  }

  const width = 640;
  const height = 140;
  const padX = 12;
  const padTop = 20;
  const padBottom = 18;
  const values = props.series.map((point) => point.responseMs);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const last = Math.max(1, props.series.length - 1);
  const coords = props.series.map((point, index) => {
    const x = padX + (index / last) * (width - 2 * padX);
    const y =
      height -
      padBottom -
      ((point.responseMs - min) / range) * (height - padTop - padBottom);
    return { x, y, responseMs: point.responseMs };
  });
  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padX},${height - padBottom} ${polyline} ${width - padX},${height - padBottom}`;
  const latest = coords[coords.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-32 w-full text-emerald-700"
        role="img"
        aria-label={props.label}
      >
        <line
          x1={padX}
          y1={height - padBottom}
          x2={width - padX}
          y2={height - padBottom}
          stroke="#d4d4d8"
          strokeWidth="1"
        />
        <line
          x1={padX}
          y1={padTop}
          x2={width - padX}
          y2={padTop}
          stroke="#e4e4e7"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <polygon points={area} fill="currentColor" className="opacity-10" />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          points={polyline}
        />
        {latest ? (
          <>
            <circle cx={latest.x} cy={latest.y} r="3.5" fill="currentColor" />
            <text
              x={Math.min(latest.x, width - padX - 8)}
              y={Math.max(latest.y - 8, 12)}
              textAnchor="end"
              className="fill-zinc-700"
              fontSize="11"
            >
              {latest.responseMs} ms
            </text>
          </>
        ) : null}
      </svg>
      <p className="text-xs text-zinc-500">
        {props.lastLabel}: {values[values.length - 1]} ms
      </p>
    </div>
  );
}
