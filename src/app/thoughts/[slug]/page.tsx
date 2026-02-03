import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClockTheme } from "@/components/clock-theme";
import { Markdown } from "@/components/markdown";
import {
  formatThoughtDate,
  getAllThoughts,
  getThoughtBySlug,
} from "@/lib/thoughts";

export async function generateStaticParams() {
  return getAllThoughts().map((thought) => ({ slug: thought.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const thought = getThoughtBySlug(params.slug);

  if (!thought) {
    return {
      title: "Thought not found - Pedro Barretto",
    };
  }

  return {
    title: `${thought.title} - Thoughts`,
    description: thought.description,
  };
}

export default function ThoughtPage({
  params,
}: {
  params: { slug: string };
}) {
  const thought = getThoughtBySlug(params.slug);

  if (!thought) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[720px] mx-auto px-6 py-16 sm:py-24">
        <header className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="text-2xl font-bold text-foreground link-underline"
          >
            Pedro Barretto
          </Link>
          <ClockTheme />
        </header>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <Link href="/thoughts" className="link-underline">
            Thoughts
          </Link>
          <span className="font-mono">{thought.readingTimeText}</span>
        </div>

        <article className="mt-10">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            {thought.title}
          </h1>
          <p className="text-muted-foreground mt-3">{thought.description}</p>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={thought.date}>{formatThoughtDate(thought.date)}</time>
            <span aria-hidden="true">•</span>
            <span>{thought.readingTimeText}</span>
            {thought.tags.length > 0 && (
              <>
                <span aria-hidden="true">•</span>
                <span>{thought.tags.join(" · ")}</span>
              </>
            )}
          </div>

          <Markdown content={thought.content} className="mt-10" />
        </article>
      </main>
    </div>
  );
}
