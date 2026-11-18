import type { FunnelStep } from "@/lib/player";

export function Funnel({ steps }: { steps: FunnelStep[] }) {
  return (
    <section className="card">
      <h2 style={{ margin: "0 0 10px" }}>The funnel</h2>
      <div className="funnel">
        {steps.map((f) => (
          <div key={f.round} className={f.live ? "fstep live" : "fstep"}>
            <div className="row sp">
              <span className="mute small">Round {f.round}</span>
              {f.live && <span className="badge red tiny">Live</span>}
            </div>
            <div>
              <b>{f.crews}</b> <span className="mute small">crews</span>
            </div>
            <div className="bar"><i style={{ width: `${f.pct}%` }} /></div>
          </div>
        ))}
      </div>
    </section>
  );
}
