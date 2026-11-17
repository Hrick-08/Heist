"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { MouseEvent, ReactNode } from "react";

const POSTER_ID = "wanted-poster";
const POSTER_HREF = `/dashboard#${POSTER_ID}`;

/**
 * The poster panel streams in with the dashboard, so it may be missing from the
 * DOM for a moment after navigating from another page. Poll briefly, then scroll
 * to it and flash it so the crew can actually spot what they asked for.
 */
function revealPoster(attempts = 40) {
  const el = document.getElementById(POSTER_ID);

  if (!el) {
    if (attempts > 0) window.setTimeout(() => revealPoster(attempts - 1), 100);
    return;
  }

  el.scrollIntoView({ behavior: "smooth", block: "center" });

  el.classList.remove("poster-flash");
  // Force a reflow so the animation restarts on repeat clicks.
  void el.offsetWidth;
  el.classList.add("poster-flash");
  window.setTimeout(() => el.classList.remove("poster-flash"), 2200);
}

export function PosterLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  // Landing on the dashboard from another page keeps #wanted-poster in the URL.
  useEffect(() => {
    if (pathname === "/dashboard" && window.location.hash === `#${POSTER_ID}`) {
      revealPoster();
    }
  }, [pathname]);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    // Already on the dashboard: skip the no-op navigation and scroll straight to
    // the poster.
    if (pathname !== "/dashboard") return;

    event.preventDefault();
    window.history.replaceState(null, "", POSTER_HREF);
    revealPoster();
  }

  return (
    <Link href={POSTER_HREF} onClick={handleClick} className={className}>
      {children}
    </Link>
  );
}
