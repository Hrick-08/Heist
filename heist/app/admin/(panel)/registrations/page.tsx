import { Suspense } from "react";

import { RegistrationsView } from "@/components/admin/registrations";
import { Skeleton } from "@/components/admin/skeleton";
import { getEventState } from "@/lib/game";
import { listRegistrations, toRegistrationRow } from "@/lib/registrations";

export const instant = false;

export const metadata = { title: "Registration" };

export default function AdminRegistrationsPage() {
  return (
    <Suspense fallback={<Skeleton blocks={2} />}>
      <Registrations />
    </Suspense>
  );
}

async function Registrations() {
  const [state, rows] = await Promise.all([getEventState(), listRegistrations()]);
  return (
    <RegistrationsView
      rows={rows.map(toRegistrationRow)}
      registrationOpen={state.registrationOpen}
      teamLoginOpen={state.teamLoginOpen !== false}
    />
  );
}
