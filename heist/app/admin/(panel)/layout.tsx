import { AdminHeader } from "@/components/admin/admin-header";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { requireAdmin } from "@/lib/session";

export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The guard lives in the layout (not inside a Suspense boundary) so an
  // unauthenticated request is redirected instead of rendering a half shell.
  const session = await requireAdmin();

  return (
    <div className="flex min-h-full flex-col">
      <AdminHeader session={session} />
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-6 px-5 py-8 lg:flex-row">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
