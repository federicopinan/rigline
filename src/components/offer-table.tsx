import { Badge } from "@/components/ui/badge";
import { retailerLabel } from "@/lib/labels";
import { formatTimestamp, formatUsd } from "@/lib/money";
import type { Offer } from "@/lib/types";

export function OfferTable({ offers }: { offers: Offer[] }) {
  const inStock = offers.filter((offer) => offer.inStock);
  const lowest = inStock.reduce<number | null>(
    (min, offer) => (min === null || offer.priceCents < min ? offer.priceCents : min),
    null,
  );

  if (offers.length === 0) {
    return <p className="text-sm text-muted-foreground">No retailer offers in the sample catalog.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <caption className="border-b border-border px-4 py-3 text-left text-muted-foreground">
          Sample offers, sorted by price. The lowest badge marks the cheapest in-stock row. These
          are not live prices.
        </caption>
        <thead className="bg-muted/60 text-xs tracking-wide text-muted-foreground uppercase">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Retailer
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Sample price
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Stock
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Last checked
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Link
            </th>
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => {
            const isLowest = offer.inStock && offer.priceCents === lowest;
            return (
              <tr key={offer.id} className="border-t border-border">
                <th scope="row" className="px-4 py-3 font-medium text-foreground">
                  {retailerLabel(offer.retailer)}
                </th>
                <td className="px-4 py-3 font-mono text-foreground">
                  <span className="inline-flex items-center gap-2">
                    {formatUsd(offer.priceCents)}
                    {isLowest ? <Badge>Lowest</Badge> : null}
                  </span>
                </td>
                <td className="px-4 py-3">{offer.inStock ? "In stock" : "Out of stock"}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatTimestamp(offer.lastCheckedAt)}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/go/${offer.id}`}
                    rel="sponsored nofollow noopener"
                    target="_blank"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View at {retailerLabel(offer.retailer)}
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
