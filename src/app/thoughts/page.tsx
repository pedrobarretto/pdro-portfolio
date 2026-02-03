import Link from "next/link";
import { ClockTheme } from "@/components/clock-theme";
import { getAllThoughts, formatThoughtDate } from "@/lib/thoughts";

export const metadata = {
  title: "Thoughts - Pedro Barretto",
  description: "Notes on software, product, and life.",
};

export default function ThoughtsPage() {
  const thoughts = getAllThoughts();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[680px] mx-auto px-6 py-16 sm:py-24">
        <header className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-2xl font-bold text-foreground link-underline"
          >
            Pedro Barretto
          </Link>
          <ClockTheme />
        </header>

        <div className="mb-12">
          <h1 className="text-xl font-semibold text-foreground">Thoughts</h1>
          <p className="text-muted-foreground mt-2">
            Notes on software, product, and life. Written in markdown, shaped by
            this site.
          </p>
        </div>

        {thoughts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
            No posts yet. Check back soon.
          </div>
        ) : (
          <div className="space-y-10">
            {thoughts.map((thought) => (
              <Link
                key={thought.slug}
                href={`/thoughts/${thought.slug}`}
                className="group block hover:opacity-70 transition-opacity"
              >
                <h2 className="text-lg font-semibold text-foreground">
                  <span className="link-underline">{thought.title}</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {thought.description}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={thought.date}>
                    {formatThoughtDate(thought.date)}
                  </time>
                  <span aria-hidden="true">•</span>
                  <span>{thought.readingTimeText}</span>
                  {thought.tags.length > 0 && (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{thought.tags.join(" · ")}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
