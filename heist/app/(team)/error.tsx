"use client";

export default function TeamError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card" role="alert" style={{ textAlign: "center", padding: "34px 20px" }}>
      <p className="p-eyebrow">Signal lost</p>
      <h1 style={{ margin: "10px 0 8px" }}>Connection jammed</h1>
      <p className="mute" style={{ marginBottom: 18 }}>
        We could not load this screen. Your progress is safe. Give it another go.
      </p>
      <button type="button" className="pbtn" style={{ marginTop: 0 }} onClick={reset}>
        Try again
      </button>
    </div>
  );
}
