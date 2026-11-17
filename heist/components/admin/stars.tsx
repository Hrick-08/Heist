/** Wanted level, 0 to 3 stars (same cap as the player app). */
export function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} of 3 wanted stars`}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={i < n ? "on" : ""}>
          <path d="M12 2l3 7 7.5.6-5.7 4.9 1.8 7.3-6.6-4-6.6 4 1.8-7.3L1.5 9.6 9 9z" />
        </svg>
      ))}
    </span>
  );
}
