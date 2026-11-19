import Link from "next/link";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";

const components: Components = {
  h2: ({ children }) => <h2 className="font-display mt-10 text-3xl text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 text-lg font-medium text-foreground">{children}</h3>,
  p: ({ children }) => <p className="mt-4 text-base leading-7 text-foreground/90">{children}</p>,
  ul: ({ children }) => <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-7">{children}</ul>,
  ol: ({ children }) => <ol className="mt-4 list-decimal space-y-2 pl-5 text-base leading-7">{children}</ol>,
  a: ({ href, children }) => {
    if (href?.startsWith("/")) {
      return (
        <Link href={href} className="text-primary underline decoration-primary/40 underline-offset-4">
          {children}
        </Link>
      );
    }
    return (
      <a href={href} rel="nofollow noopener" className="text-primary underline underline-offset-4">
        {children}
      </a>
    );
  },
  strong: ({ children }) => <strong className="font-medium text-foreground">{children}</strong>,
};

export function GuideBody({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-3xl">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
