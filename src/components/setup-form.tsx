import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BuildRequest, Category } from "@/lib/types";

const PLATFORMS = [
  { value: "ps5", label: "PS5", note: "Launch platform" },
  { value: "xbox", label: "Xbox Series", note: "Launch platform" },
  { value: "pc-later", label: "PC later", note: "No game at launch" },
] as const;

const PLAY = [
  { value: "cinematic", label: "Cinematic", note: "Bigger screen, wider sound" },
  { value: "competitive", label: "Competitive", note: "Refresh rate and a lighter pad" },
  { value: "balanced", label: "Balanced", note: "Split the difference" },
] as const;

const OWNED: { value: Category; label: string }[] = [
  { value: "console", label: "Console" },
  { value: "display", label: "Screen" },
  { value: "headset", label: "Headset" },
  { value: "controller", label: "Controller" },
  { value: "storage", label: "Storage" },
];

export function SetupForm({ request }: { request: BuildRequest }) {
  return (
    <form action="/build" method="get" className="rounded-2xl border border-border bg-card p-5 shadow-none sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl text-foreground">Your budget</h2>
        <p className="text-xs tracking-wide text-muted-foreground uppercase">USD only</p>
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        The result is the URL. Change a number, share the link, get the same setup.
      </p>

      <div className="mt-5">
        <Label htmlFor="budget">Budget in dollars</Label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-muted-foreground" aria-hidden>
            $
          </span>
          <Input
            id="budget"
            name="budget"
            type="number"
            inputMode="numeric"
            min={100}
            max={8000}
            step={1}
            required
            defaultValue={request.budgetCents / 100}
            className="h-11 text-base"
          />
        </div>
      </div>
      <input type="hidden" name="currency" value="USD" />

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Platform</legend>
        <div className="mt-2 grid gap-2">
          {PLATFORMS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-2 has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="radio"
                name="platform"
                value={option.value}
                defaultChecked={request.platform === option.value}
                className="mt-1 accent-[oklch(0.74_0.16_48)]"
              />
              <span>
                <span className="block text-sm font-medium">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">How you play</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {PLAY.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border px-3 py-2 has-checked:border-primary has-checked:bg-primary/10"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="play"
                  value={option.value}
                  defaultChecked={request.preference === option.value}
                  className="accent-[oklch(0.74_0.16_48)]"
                />
                {option.label}
              </span>
              <span className="text-xs text-muted-foreground">{option.note}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Already own</legend>
        <p className="mt-1 text-xs text-muted-foreground">Checked gear is skipped and its share stays in the budget.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {OWNED.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="checkbox"
                name="own"
                value={option.value}
                defaultChecked={request.owned.includes(option.value)}
                className="accent-[oklch(0.74_0.16_48)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Optional</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["chair", "desk"] as const).map((extra) => (
            <label
              key={extra}
              className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="checkbox"
                name="extras"
                value={extra}
                defaultChecked={request.extras.includes(extra)}
                className="accent-[oklch(0.74_0.16_48)]"
              />
              Add a {extra}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" className="mt-6 h-11 w-full text-base">
        Build this setup
      </Button>
    </form>
  );
}
