"use client";

export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="panel" role="alert">
      <div className="empty">
        <span className="eyebrow">Signal lost</span>
        <b>The desk hit a snag</b>
        <p className="mute small">This screen could not load. Nothing was changed. Try again.</p>
        <button type="button" className="btn" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
