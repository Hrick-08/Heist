"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/** Keeps a public page live: refetches every ~15s while visible, and on focus. */
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [every] = useState(() => intervalMs + Math.floor(Math.random() * 4000));

  useEffect(() => {
    const go = () => {
      if (document.visibilityState === "visible") start(() => router.refresh());
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

  return <div className={pending ? "syncbar on" : "syncbar"} aria-hidden />;
}
