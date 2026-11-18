import { AdminProvider } from "@/components/admin/provider";
import { SideNav, TopBar } from "@/components/admin/shell";
import { getAdminSnapshot } from "@/lib/admin-view";
import { requireAdmin } from "@/lib/session";

import "../admin.css";

export const instant = false;

export const metadata = {
  title: { default: "Control room", template: "%s · Control room" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The guard lives in the layout (not inside a Suspense boundary) so an
  // unauthenticated request is redirected instead of rendering a half shell.
  const session = await requireAdmin();
  const snap = await getAdminSnapshot();

  return (
    <div className="ad">
      <AdminProvider snap={snap}>
        <header className="hdr">
          <TopBar operator={session.name} />
          <SideNav />
        </header>
        <main className="app">{children}</main>
      </AdminProvider>
    </div>
  );
}
