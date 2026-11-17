import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="panel">
      <div className="empty">
        <span className="eyebrow">Error 404</span>
        <b>Nothing here</b>
        <p className="mute small">That crew or page does not exist. It may have been removed.</p>
        <Link href="/admin" className="btn">
          Back to the overview
        </Link>
      </div>
    </div>
  );
}
