import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { TeamLoginForm } from "@/components/team-login-form";
import { getEventState } from "@/lib/game";

export const metadata: Metadata = {
  title: "Team Login",
  robots: { index: false, follow: false },
};

export default async function TeamLoginPage() {
  const state = await getEventState();

  return (
    <AuthShell variant="team" registrationOpen={state.registrationOpen}>
      <div className="au-pass">
        <i className="au-hole" aria-hidden />
        <div className="au-passhead" aria-hidden>
          <span>Crew pass</span>
          <span className="au-bars" />
        </div>
        <h1>Team login</h1>
        {state.teamLoginOpen === false ? (
          <p className="au-sub">
            Team login is closed right now. Check back soon, your crew will be able to sign in
            again once control opens it.
          </p>
        ) : (
          <>
            <p className="au-sub">
              Enter the TEAM ID on your registration slip and the passcode mailed to your leader.
            </p>
            <TeamLoginForm />
          </>
        )}
        {state.registrationOpen && (
          <p className="au-fine">
            Don&rsquo;t have a Team ID yet?{" "}
            <Link href="/register" style={{ color: "inherit", fontWeight: 700 }}>
              Register your crew
            </Link>{" "}
            instead.
          </p>
        )}
      </div>
    </AuthShell>
  );
}
