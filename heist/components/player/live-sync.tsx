"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

/**
 * Keeps the page live without anyone pressing reload.
 *  - re-fetches the server data every ~10s while the tab is visible
 *  - re-fetches instantly when the tab regains focus or the phone comes back online
 *  - shows a sweeping bar while it fetches
 * router.refresh() keeps client state (open sheets, filters) intact. What changed is
 * announced by the notification centre in the top bar.
 */
export function LiveSync({ intervalMs = 10000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [every] = useState(() => intervalMs + Math.floor(Math.random() * 3000));

  const refresh = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    start(() => router.refresh());
  }, [router]);

  useEffect(() => {
    const id = window.setInterval(refresh, every);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [refresh, every]);

  return <div className={pending ? "syncbar on" : "syncbar"} aria-hidden />;
}
