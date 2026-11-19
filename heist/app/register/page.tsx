import Link from "next/link";
import type { Metadata } from "next";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { getEventState } from "@/lib/game";

export const metadata: Metadata = {
  title: "Register Your Crew",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function RegisterPage() {
  const state = await getEventState();

  if (!state.registrationOpen) {
    return (
      <AuthShell variant="register" registrationOpen={false}>
        <div className="au-pass">
          <i className="au-hole" aria-hidden />
          <div className="au-passhead" aria-hidden>
            <span>Crew pass</span>
            <span className="au-bars" />
          </div>
          <h1>Registrations are closed</h1>
          <p className="au-sub">
            Sign-ups aren&rsquo;t open right now. Check back soon, or if your crew already has a
            Team ID, use team login instead.
          </p>
          <Link href="/login" className="au-btn" style={{ textDecoration: "none", marginTop: 18 }}>
            Go to team login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell variant="register" registrationOpen>
      <div className="au-pass">
        <i className="au-hole" aria-hidden />
        <div className="au-passhead" aria-hidden>
          <span>Crew sign-up</span>
          <span className="au-bars" />
        </div>
        <h1>Register your crew</h1>
        <p className="au-sub">
          Leader plus 3 crew mates are required, a 4th is optional. Add one photo of the whole
          crew. We will email the leader if your crew is selected.
        </p>
        <RegisterForm />
      </div>
    </AuthShell>
  );
}
