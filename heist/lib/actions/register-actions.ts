"use server";

import { revalidatePath } from "next/cache";

import { getEventState } from "@/lib/game";
import { createRegistration } from "@/lib/registrations";
import type { Member } from "@/lib/types";

export interface RegisterState {
  error?: string;
  /** Name of the input that failed validation, so the form can highlight and focus it. */
  field?: string;
  /** Set once the sign-up is saved, so the page can swap the form for the thank-you. */
  done?: { crew: string };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The only photo format the form produces (a resized JPEG, see PhotoField). */
const PHOTO = /^data:image\/jpeg;base64,(\/9j\/[A-Za-z0-9+/=]+)$/;
const MAX_PHOTO_CHARS = 450_000;

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Optional: set COLLEGE_EMAIL_DOMAINS="chitkara.edu.in" (comma separated) to insist on college addresses. */
function collegeDomains(): string[] {
  return (process.env.COLLEGE_EMAIL_DOMAINS ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

function readPerson(
  formData: FormData,
  prefix: string,
  label: string,
  domains: string[],
  role: string,
): { person: Member } | { error: string; field: string } {
  const name = text(formData, `${prefix}Name`, 80);
  const email = text(formData, `${prefix}Email`, 160).toLowerCase();
  const phone = text(formData, `${prefix}Phone`, 30).replace(/[\s()-]/g, "");

  if (name.length < 2) return { error: `${label}: enter a name.`, field: `${prefix}Name` };
  if (!/^\+?\d{10,13}$/.test(phone)) {
    return { error: `${label}: enter a valid phone number (10 digits).`, field: `${prefix}Phone` };
  }
  if (!EMAIL.test(email)) return { error: `${label}: enter a valid email.`, field: `${prefix}Email` };
  if (domains.length && !domains.some((d) => email.endsWith(`@${d}`) || email.endsWith(`.${d}`))) {
    return { error: `${label}: use your college email (…@${domains[0]}).`, field: `${prefix}Email` };
  }
  return { person: { name, phone, email, role } };
}

export async function submitRegistrationAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  // A field real people never see. Bots fill it in, so they get a fake thank-you and nothing is stored.
  if (text(formData, "contact_fax", 200)) {
    return { done: { crew: "your crew" } };
  }

  const state = await getEventState();
  if (!state.registrationOpen) {
    return { error: "Registrations are closed right now. Check back soon." };
  }

  const domains = collegeDomains();
  const crewName = text(formData, "crewName", 60);

  const leader = readPerson(formData, "leader", "Leader", domains, "leader");
  if ("error" in leader) return { error: leader.error, field: leader.field };

  const members: Member[] = [];
  for (const n of [1, 2, 3, 4]) {
    const touched = ["Name", "Phone", "Email"].some((f) => text(formData, `m${n}${f}`, 160));
    // Crew 4 is optional. Crews 1-3 are not.
    if (n === 4 && !touched) continue;
    const member = readPerson(formData, `m${n}`, `Crew ${n}`, domains, "member");
    if ("error" in member) return { error: member.error, field: member.field };
    members.push(member.person);
  }

  const photo = String(formData.get("photo") ?? "").trim();
  const match = PHOTO.exec(photo);
  if (!photo) return { error: "Add a team photo.", field: "photo" };
  if (!match || photo.length > MAX_PHOTO_CHARS) {
    return { error: "That photo could not be used. Pick a different one.", field: "photo" };
  }

  const result = await createRegistration({
    crewName,
    leader: leader.person,
    members,
    leaderPhoto: photo,
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/admin/registrations");
  return { done: { crew: crewName || `Team ${leader.person.name.split(" ")[0]}` } };
}
