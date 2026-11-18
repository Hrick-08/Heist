"use client";

import Link from "next/link";

import "@/app/(team)/player.css";
import "@/app/public.css";

export default function RootError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="pl pu">
      <main className="pu-center">
        <div className="pu-err" role="alert">
          <div className="big404">!</div>
          <span className="pu-eyebrow">Signal lost</span>
          <h1>Something jammed</h1>
          <p>The heist hit a snag on our side. Try again, and if it keeps happening tell the desk.</p>
          <div className="pu-ctas">
            <button type="button" className="pbtn" style={{ marginTop: 0 }} onClick={reset}>
              Try again
            </button>
            <Link href="/" className="pbtn line">
              Back to the briefing
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
