"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { useOnline } from "@/components/use-online";

/** Keeps a public page live: refetches every ~20s while visible and online, and on focus. */
export function AutoRefresh({ intervalMs = 20000 }: { intervalMs?: number }) {
  const router = useRouter();
  const online = useOnline();
  const [pending, start] = useTransition();
  const [every] = useState(() => intervalMs + Math.floor(Math.random() * 4000));

  useEffect(() => {
    const go = () => {
      if (document.visibilityState === "visible" && navigator.onLine) start(() => router.refresh());
    };
    const id = window.setInterval(go, every);
    document.addEventListener("visibilitychange", go);
    window.addEventListener("focus", go);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", go);
      window.removeEventListener("focus", go);
    };
  }, [router, every]);

  return (
    <>
      <div className={pending ? "syncbar on" : "syncbar"} aria-hidden />
      {!online && (
        <div className="offline" role="status">
          You are offline. The board will update when you reconnect.
        </div>
      )}
    </>
  );
}
