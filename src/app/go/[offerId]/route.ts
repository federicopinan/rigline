import { affiliateEnvFromProcess, buildAffiliateUrl } from "@/lib/affiliate";
import { findOffer, logClick, readCatalog } from "@/lib/catalog";

export async function GET(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const { offerId } = await context.params;
  const snapshot = await readCatalog();
  const found = findOffer(snapshot, offerId);
  if (!found) {
    return new Response("Offer not found", { status: 404 });
  }

  let destination: string;
  try {
    destination = buildAffiliateUrl(found.offer.url, found.offer.program, affiliateEnvFromProcess());
  } catch {
    return new Response("Offer URL is invalid", { status: 500 });
  }

  try {
    await logClick({
      offerId,
      referrer: request.headers.get("referer")?.slice(0, 500) ?? null,
      userAgent: request.headers.get("user-agent")?.slice(0, 300) ?? null,
      destinationUrl: destination,
      clickedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Click log failed", error);
  }

  return Response.redirect(destination, 302);
}
