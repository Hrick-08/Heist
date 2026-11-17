/** Shimmering placeholders: a light sweep runs across every block while the page loads. */
export function Skeleton({ stats = 4, blocks = 2 }: { stats?: number; blocks?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skl" style={{ height: 70, width: "min(360px,70%)", marginBottom: 22 }} />
      <div className="stats">
        {Array.from({ length: stats }, (_, i) => (
          <div key={i} className="card skl" style={{ height: 112 }} />
        ))}
      </div>
      {Array.from({ length: blocks }, (_, i) => (
        <div key={i} className="panel skl" style={{ height: 260, marginBottom: 14 }} />
      ))}
    </div>
  );
}
