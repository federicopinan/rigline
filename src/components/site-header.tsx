import Link from "next/link";

const LINKS = [
  { href: "/build", label: "Builder" },
  { href: "/products", label: "Gear" },
  { href: "/guides", label: "Guides" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="group">
          <span className="font-display text-2xl tracking-tight text-foreground">Rigline</span>
          <span className="mt-0.5 block text-xs tracking-[0.16em] text-muted-foreground uppercase">
            GTA 6 setup builder
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-foreground/90 hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="border-t border-border/70 bg-primary/15 px-4 py-2 text-center text-sm text-foreground">
        Affiliate links may earn Rigline a commission. Every price on this site is a{" "}
        <strong>sample catalog price</strong>, not a live quote.{" "}
        <Link href="/disclosure" className="underline underline-offset-4">
          Affiliate disclosure
        </Link>
      </p>
    </header>
  );
}
