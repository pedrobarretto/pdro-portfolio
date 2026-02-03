"use client";

import { ClockTheme } from "@/components/clock-theme";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";

type Project = {
  name: string;
  description: string;
  url?: string;
};

type ThoughtPost = {
  title: string;
  description: string;
  slug?: string;
};

type CoolLink = {
  title: string;
  description: string;
  url: string;
};

type HomeClientProps = {
  thoughts: ThoughtPost[];
};

const DEFAULT_VISIBLE_COUNT = 3;

const projects: Project[] = [
  {
    name: "SuaOraçãoDiaria.com.br",
    description:
      "Create your daily prayer image and share with the ones you love.",
    url: "https://suaoracaodiaria.com.br",
  },
  {
    name: "Pace",
    description: "Build your habits calmly, at your own pace.",
    url: "https://pedrobarretto.com/pace",
  },
];

const coolLinks: CoolLink[] = [
  {
    title: "It Only Takes Two Weeks",
    description: "This video will change your life. It has changed mine.",
    url: "https://www.youtube.com/watch?v=sZ60bY2pJfo",
  },
  {
    title: "AI Playing Chess",
    description: "A chess match between LLMs.",
    url: "https://v0-chess-match.vercel.app/",
  },
  {
    title: "Stripe Press",
    description: "Books I wanna read",
    url: "https://press.stripe.com/",
  },
];

function SectionHeader({
  title,
  showMore = false,
  isExpanded = false,
  onToggle,
  controlsId,
}: {
  title: string;
  showMore?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  controlsId?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {showMore && onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          aria-controls={controlsId}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors link-underline cursor-pointer"
        >
          {isExpanded ? "Less" : "More"}
        </button>
      )}
    </div>
  );
}

function ProjectItem({ project }: { project: Project }) {
  if (project.url) {
    return (
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group block hover:opacity-70 transition-opacity"
      >
        <h3 className="font-medium text-foreground">
          <span className="link-underline">{project.name}</span>
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {project.description}
        </p>
      </a>
    );
  }

  return (
    <div>
      <h3 className="font-medium text-foreground">{project.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {project.description}
      </p>
    </div>
  );
}

function ThoughtItem({ thought }: { thought: ThoughtPost }) {
  if (!thought.slug) {
    return (
      <div>
        <h3 className="font-medium text-foreground">{thought.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {thought.description}
        </p>
      </div>
    );
  }

  return (
    <Link
      href={`/thoughts/${thought.slug}`}
      className="group block hover:opacity-70 transition-opacity"
    >
      <h3 className="font-medium text-foreground">
        <span className="link-underline">{thought.title}</span>
      </h3>
      <p className="text-sm text-muted-foreground mt-1">
        {thought.description}
      </p>
    </Link>
  );
}

function CoolLinkItem({ link }: { link: CoolLink }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block hover:opacity-70 transition-opacity"
    >
      <h3 className="font-medium text-foreground">
        <span className="link-underline">{link.title}</span>
      </h3>
      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
    </a>
  );
}

type ExpandableSectionProps<T> = {
  title: string;
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
};

function ExpandableSection<T>({
  title,
  items,
  itemKey,
  renderItem,
}: ExpandableSectionProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const hasMore = items.length > DEFAULT_VISIBLE_COUNT;
  const visibleItems = items.slice(0, DEFAULT_VISIBLE_COUNT);
  const extraItems = items.slice(DEFAULT_VISIBLE_COUNT);

  return (
    <section className="mb-16">
      <SectionHeader
        title={title}
        showMore={hasMore}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded((prev) => !prev)}
        controlsId={contentId}
      />
      <div className="space-y-6">
        {visibleItems.map((item) => (
          <div key={itemKey(item)}>{renderItem(item)}</div>
        ))}
      </div>
      {hasMore && (
        <div
          id={contentId}
          aria-hidden={!isExpanded}
          className={[
            "overflow-hidden transition-[max-height,opacity,margin] duration-500",
            "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
            isExpanded
              ? "max-h-[2000px] opacity-100 mt-6"
              : "max-h-0 opacity-0 mt-0 pointer-events-none",
          ].join(" ")}
        >
          <div
            className={[
              "space-y-6 transition-[opacity,filter,transform] duration-500",
              "ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
              isExpanded
                ? "opacity-100 blur-0 translate-y-0"
                : "opacity-0 blur-[3px] translate-y-2",
            ].join(" ")}
          >
            {extraItems.map((item) => (
              <div key={itemKey(item)}>{renderItem(item)}</div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function HomeClient({ thoughts }: HomeClientProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[640px] mx-auto px-6 py-16 sm:py-24">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pedro Barretto</h1>
          <ClockTheme />
        </header>

        <p className="text-muted-foreground mb-16">
          Brazilian SWE working for 🇺🇸 who loves to code and build cool stuff.
        </p>

        <ExpandableSection
          title="Projects"
          items={projects}
          itemKey={(project) => project.name}
          renderItem={(project) => <ProjectItem project={project} />}
        />

        <ExpandableSection
          title="Thoughts"
          items={thoughts}
          itemKey={(thought) => thought.slug ?? thought.title}
          renderItem={(thought) => <ThoughtItem thought={thought} />}
        />

        <ExpandableSection
          title="Cool Links"
          items={coolLinks}
          itemKey={(link) => link.url}
          renderItem={(link) => <CoolLinkItem link={link} />}
        />

        <footer className="flex items-center gap-6 pt-8">
          <a
            href="https://twitter.com/pedrobarretto_"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            aria-label="X (Twitter)"
          >
            X
          </a>
          <a
            href="mailto:pedro@barretto.com.br"
            className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            aria-label="Email"
          >
            Email
          </a>
          <a
            href="https://github.com/pedrobarretto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            aria-label="GitHub"
          >
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/pedrobarretto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            aria-label="LinkedIn"
          >
            LinkedIn
          </a>
        </footer>
      </main>
    </div>
  );
}
