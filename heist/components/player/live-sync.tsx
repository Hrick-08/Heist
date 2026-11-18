"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import { useOnline } from "@/components/use-online";

function clock(d: Date) {
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Keeps the page live without anyone pressing reload.
 *  - re-fetches the server data every ~15s while the tab is visible and online
 *  - re-fetches instantly when the tab regains focus or the phone comes back online
 *  - shows a sweeping bar while it fetches, and an offline note when the network drops
 * router.refresh() keeps client state (open sheets, filters) intact. What changed is
 * announced by the notification centre in the top bar.
 */
export function LiveSync({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  const online = useOnline();
  const [pending, start] = useTransition();
  const [every] = useState(() => intervalMs + Math.floor(Math.random() * 4000));
  const [updated, setUpdated] = useState<Date | null>(null);

  const refresh = useCallback(() => {
    if (document.visibilityState !== "visible" || !navigator.onLine) return;
    start(() => router.refresh());
  }, [router]);

  useEffect(() => {
    if (!pending) setUpdated(new Date());
  }, [pending]);

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

  return (
    <>
      <div className={pending ? "syncbar on" : "syncbar"} aria-hidden />
      {!online && (
        <div className="offline" role="status">
          You are offline{updated ? ` · showing data from ${clock(updated)}` : ""}
        </div>
      )}
    </>
  );
}
