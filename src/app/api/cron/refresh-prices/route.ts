import { isCronAuthorized } from "@/lib/cron-auth";
import { refreshStaleOffers } from "@/lib/pricing/refresh";

/**
 * Vercel Cron calls this daily. The platform sends
 * `Authorization: Bearer $CRON_SECRET`. Requests without that header are rejected.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const report = await refreshStaleOffers();
    return Response.json(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Price refresh failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
