const tones = ["#5d7fae", "#a5584c", "#b08d3e", "#5f8a5b", "#85709f", "#a8704a"];

/**
 * A crew has ONE image (the team photo). Without a photo we fall back to the
 * generated silhouette from the mock, seeded by the team id.
 */
export function TeamAvatar({
  teamId,
  name,
  hasPhoto,
  size = 36,
  square = false,
}: {
  teamId: string;
  name: string;
  hasPhoto: boolean;
  size?: number;
  square?: boolean;
}) {
  const cls = square ? "av sq" : "av";
  if (hasPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/photo/${encodeURIComponent(teamId)}`}
        width={size}
        height={size}
        alt={name}
        className={cls}
        loading="lazy"
      />
    );
  }
  const h = [...teamId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={cls} role="img" aria-label={name}>
      <rect width="40" height="40" fill={tones[h % tones.length]} />
      <circle cx="20" cy="15.5" r="6.8" fill="rgba(255,255,255,.88)" />
      <path d="M6.5 40c0-8.5 6-13 13.5-13s13.5 4.5 13.5 13z" fill="rgba(255,255,255,.88)" />
    </svg>
  );
}
