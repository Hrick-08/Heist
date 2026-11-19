/** Event is run in India, so times are always shown in IST (same text on server and browser). */
const TZ = "Asia/Kolkata";

export const money = (n: number) => "$" + n.toLocaleString("en-IN");
export const num = (n: number) => n.toLocaleString("en-IN");

export function time(date: Date | string | number | null | undefined): string {
  if (date === null || date === undefined) return "";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

export function dateTime(date: Date | string | number | null | undefined): string {
  if (date === null || date === undefined) return "";
  return new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}

export const STATUS_TAG: Record<string, [string, string]> = {
  selected: ["In play", "blue"],
  eliminated: ["Eliminated", "red"],
  waitlisted: ["Waitlisted", "gold"],
  champion: ["Champion", "cash"],
  registered: ["Not in heist", "gold"],
};
