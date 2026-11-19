/** Whole dollars when the sample price lands on a dollar, otherwise cents. */
export function formatUsd(cents: number): string {
  const rounded = Math.round(cents);
  const hasCents = rounded % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(rounded / 100);
}

/** Format a stored ISO timestamp without reading the current clock. */
export function formatTimestamp(iso: string): string {
  const [date, timePart] = iso.split("T");
  if (!date || !timePart) return iso;
  const time = timePart.slice(0, 5);
  return `${date} ${time} UTC`;
}
