import type { Metadata } from "next";

import { AdminLoginForm } from "@/components/admin-login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Control Room Login",
  robots: { index: false, follow: false },
};

export const instant = false;

export default function AdminLoginPage() {
  return (
    <AuthShell variant="admin">
      <div className="au-pass admin">
        <i className="au-strip" aria-hidden />
        <i className="au-hole" aria-hidden />
        <div className="au-passhead" aria-hidden>
          <span>Operator pass</span>
          <span className="au-bars" />
        </div>
        <h1>Control room</h1>
        <span className="au-stamp" aria-hidden>Restricted</span>
        <p className="au-sub">Admin access only. Sign in to run the heist.</p>
        <AdminLoginForm />
      </div>
    </AuthShell>
  );
}
