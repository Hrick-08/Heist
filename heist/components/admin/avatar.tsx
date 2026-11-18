/* Always round. Uses the crew's photo (served from /api/photo) when there is one, else a silhouette. */
const tones = ["#5d7fae", "#a5584c", "#b08d3e", "#5f8a5b", "#85709f", "#a8704a"];

export function Avatar({
  teamId,
  hasPhoto = false,
  size = 36,
  label,
}: {
  teamId: string;
  hasPhoto?: boolean;
  size?: number;
  label?: string;
}) {
  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/photo/${encodeURIComponent(teamId)}`}
        width={size}
        height={size}
        className="av"
        alt={label ?? "Leader photo"}
        loading="lazy"
        style={{ width: size, height: size }}
      />
    );
  }
  const h = [...teamId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="av" role="img" aria-label={label ?? "Crew"}>
      <defs>
        <clipPath id={`avc${h}`}>
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath={`url(#avc${h})`}>
        <rect width="40" height="40" fill={tones[h % tones.length]} />
        <circle cx="20" cy="15.5" r="6.8" fill="rgba(255,255,255,.88)" />
        <path d="M6.5 40c0-8.5 6-13 13.5-13s13.5 4.5 13.5 13z" fill="rgba(255,255,255,.88)" />
      </g>
    </svg>
  );
}
