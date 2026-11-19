import { categoryLabel } from "@/lib/recommend";
import { formatUsd } from "@/lib/money";
import type { Category } from "@/lib/types";

const TONE: Record<Category, string> = {
  console: "bg-primary",
  display: "bg-[oklch(0.72_0.08_200)]",
  headset: "bg-[oklch(0.78_0.12_85)]",
  controller: "bg-[oklch(0.7_0.14_25)]",
  storage: "bg-[oklch(0.75_0.08_150)]",
  chair: "bg-[oklch(0.68_0.06_300)]",
  desk: "bg-[oklch(0.7_0.04_80)]",
};

export function SpendBar({
  budgetCents,
  slices,
  leftoverCents,
}: {
  budgetCents: number;
  slices: { category: Category; cents: number }[];
  leftoverCents: number;
}) {
  if (budgetCents <= 0) return null;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
        {slices.map((slice) => (
          <div
            key={slice.category}
            className={TONE[slice.category]}
            style={{ width: `${(slice.cents / budgetCents) * 100}%` }}
          />
        ))}
        {leftoverCents > 0 ? (
          <div className="bg-border" style={{ width: `${(leftoverCents / budgetCents) * 100}%` }} />
        ) : null}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {slices.map((slice) => (
          <li key={slice.category} className="flex items-center gap-2">
            <span className={`inline-block size-2 rounded-full ${TONE[slice.category]}`} />
            {categoryLabel(slice.category)} {formatUsd(slice.cents)}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-border" />
          Left {formatUsd(leftoverCents)}
        </li>
      </ul>
    </div>
  );
}
