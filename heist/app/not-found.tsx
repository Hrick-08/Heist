import Link from "next/link";

import { TeamAvatar } from "@/components/player/avatar";
import { WantedTitle } from "@/components/player/wanted-title";
import { PublicFooter, PublicHeader, PublicShell } from "@/components/public/shell";

export default function NotFound() {
  return (
    <PublicShell>
      <PublicHeader />
      <main className="pu-center">
        <div className="pu-miss">
          <div>
            <span className="pu-eyebrow">Error 404</span>
            <h1>Nothing to rob here</h1>
            <p>
              That page does not exist, or it was moved off the board. Check the link, or head back
              to somewhere with actual loot.
            </p>
            <div className="pu-ctas">
              <Link href="/" className="pbtn">
                Back to the briefing
              </Link>
              <Link href="/login" className="pbtn line">
                Team login
              </Link>
            </div>
          </div>

          <div className="pu-poster" aria-hidden>
            <div className="wp-wrap">
              <div className="wp clear">
                <i className="tape t1" />
                <i className="tape t2" />
                <div className="wp-in">
                  <span className="wp-code">No. 404</span>
                  <WantedTitle />
                  <p className="wp-sub">This page</p>
                  <div className="wp-mug">
                    <TeamAvatar teamId="404" name="Missing page" hasPhoto={false} size={120} square />
                  </div>
                  <b className="wp-name">Page not found</b>
                  <span className="wp-lead">Last seen: nowhere</span>
                  <p className="wp-fine">If found, please return to the homepage.</p>
                </div>
                <span className="wp-stamp">Missing</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </PublicShell>
  );
}
