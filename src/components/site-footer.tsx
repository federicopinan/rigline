import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="font-display text-lg text-foreground">Rigline</p>
          <p className="mt-2 max-w-prose leading-6">
            GTA 6 launches on PS5 and Xbox Series. A PC version is not available at launch, so this
            builder will not recommend a graphics card as if it were. Prices are seeded samples for
            the demo.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link href="/build?budget=1000&platform=ps5&play=balanced&currency=USD" className="hover:text-foreground">
            $1,000 PS5 setup
          </Link>
          <Link href="/guides" className="hover:text-foreground">
            Buying guides
          </Link>
          <Link href="/disclosure" className="hover:text-foreground">
            Affiliate disclosure
          </Link>
        </div>
      </div>
    </footer>
  );
}
