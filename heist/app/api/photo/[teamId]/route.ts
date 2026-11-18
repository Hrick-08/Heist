import { getSession } from "@/lib/auth";
import { getTeam } from "@/lib/game";

/**
 * Serves a crew's single team photo (the leader photo stored on the team) as a
 * real image so it can be cached by the browser instead of being inlined as a
 * huge base64 string in every page.
 *
 * Only signed-in crews and admins may fetch it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });

  const { teamId } = await params;
  const team = await getTeam(decodeURIComponent(teamId).toUpperCase());
  const photo = team?.leader.photo;
  if (!photo) return new Response("No photo.", { status: 404 });

  if (/^https:\/\//i.test(photo)) {
    return Response.redirect(photo, 302);
  }

  // Raster formats only: an SVG served from this origin could carry script.
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/i.exec(photo);
  if (!match) return new Response("Unsupported photo.", { status: 415 });

  return new Response(Buffer.from(match[2], "base64"), {
    headers: {
      "Content-Type": match[1].toLowerCase(),
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      Vary: "Cookie",
    },
  });
}
