import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { TeamLoginForm } from "@/components/team-login-form";

export const metadata: Metadata = {
  title: "Team Login",
};

export default function TeamLoginPage() {
  return (
    <AuthShell variant="team">
      <div className="au-pass">
        <i className="au-hole" aria-hidden />
        <div className="au-passhead" aria-hidden>
          <span>Crew pass</span>
          <span className="au-bars" />
        </div>
        <h1>Team login</h1>
        <p className="au-sub">
          Enter the TEAM ID on your registration slip and the passcode mailed to your leader.
        </p>
        <TeamLoginForm />
      </div>
    </AuthShell>
  );
}
