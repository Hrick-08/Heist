import Link from "next/link";

export default function TeamNotFound() {
  return (
    <div className="card" style={{ textAlign: "center", padding: "34px 20px" }}>
      <p className="p-eyebrow">Error 404</p>
      <h1 style={{ margin: "10px 0 8px" }}>Dead end</h1>
      <p className="mute" style={{ marginBottom: 18 }}>
        That mission or task is not on your board. It may have been pulled, or it was never aimed at
        your crew.
      </p>
      <Link href="/dashboard" className="pbtn" style={{ marginTop: 0 }}>
        Back to home
      </Link>
    </div>
  );
}
