import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <p className="text-xs tracking-[0.18em] text-primary uppercase">404</p>
      <h1 className="font-display mt-2 text-4xl text-foreground">That page is not in the catalog.</h1>
      <p className="mt-3 text-muted-foreground">
        The setup builder and the gear list are still here.
      </p>
      <div className="mt-6 flex gap-4 text-sm">
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          Home
        </Link>
        <Link href="/products" className="text-primary underline-offset-4 hover:underline">
          Gear
        </Link>
      </div>
    </div>
  );
}
