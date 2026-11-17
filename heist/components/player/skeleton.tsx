/** Shimmering placeholders: a light sweep runs across every block while data loads. */
export function HomeSkeleton() {
  return (
    <div className="home" aria-busy="true" aria-label="Loading">
      <div className="card sk" style={{ height: 230 }} />
      <div className="card sk" style={{ height: 130 }} />
      <div className="stats">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="card sk" style={{ height: 84 }} />
        ))}
      </div>
      <div className="card sk" style={{ height: 240 }} />
    </div>
  );
}

export function BlockSkeleton({ height = 240 }: { height?: number }) {
  return <div className="card sk" style={{ height }} aria-busy="true" aria-label="Loading" />;
}
