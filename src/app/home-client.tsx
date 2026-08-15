"use client";

import { ClockTheme } from "@/components/clock-theme";
import { MusicNoteEasterEgg } from "@/components/music-note-easter-egg";
import Image from "next/image";
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from "react";

type Project = {
  name: string;
  description: string;
  url?: string;
  icon?: string;
  // Reserved for future live demos (e.g. an embedded ChatDeIA chat)
  embed?: ReactNode;
};

const DEFAULT_VISIBLE_COUNT = 3;

type Social = {
  label: string;
  url: string;
  icon: string;
  // Dark marks on transparent backgrounds disappear on the dark theme
  darkInvert?: boolean;
};

const socials: Social[] = [
  {
    label: "X (Twitter)",
    url: "https://twitter.com/pedrobarretto_",
    icon: "/icons/x.png",
  },
  {
    label: "Email",
    url: "mailto:pedro@barretto.com.br",
    icon: "/icons/gmail.png",
  },
  {
    label: "GitHub",
    url: "https://github.com/pedrobarretto",
    icon: "/icons/github.png",
    darkInvert: true,
  },
  {
    label: "LinkedIn",
    url: "https://linkedin.com/in/pedrobarretto",
    icon: "/icons/linkedin.png",
  },
];

const projects: Project[] = [
  {
    name: "ChatDeIA",
    description:
      "AI attendants that answer your customers on WhatsApp and your website in seconds — 24/7, in your tone of voice.",
    url: "https://chatde.ia.br",
    icon: "/icons/chatdeia.png",
  },
  {
    name: "Pace",
    description:
      "A habit tracker for iOS that doesn't guilt-trip you. Build habits calmly, at your own pace.",
    url: "https://apps.apple.com/br/app/pace-build-habits-calmly/id6757363838",
    icon: "/icons/pace.png",
  },
  {
    name: "Diário da Pílula",
    description:
      "Birth control tracking that never lets a day slip: 100% web, no install, and a notification right when it's time. Built for my love, Gianna.",
    url: "https://diariodapilula.com.br",
    icon: "/icons/diariodapilula.png",
  },
  {
    name: "SuaOraçãoDiária",
    description:
      "Create a daily prayer image and share it with the people you love.",
    url: "https://suaoracaodiaria.com.br",
    icon: "/icons/suaoracaodiaria.png",
  },
  {
    name: "Codex Account Hub",
    description:
      "Open-source macOS menu bar app to switch between Codex accounts without the logout dance.",
    url: "https://github.com/pedrobarretto/codex-account-hub",
    icon: "/icons/codex-account-hub.png",
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
  const body = (
    <div className="flex gap-3">
      {project.icon && (
        <Image
          src={project.icon}
          alt=""
          width={20}
          height={20}
          className="mt-0.5 size-5 shrink-0 rounded-[5px] sm:grayscale sm:opacity-80 transition-[filter,opacity] duration-300 sm:group-hover:grayscale-0 sm:group-hover:opacity-100"
        />
      )}
      <div>
        <h3 className="font-medium text-foreground">
          {project.url ? (
            <span className="link-underline">{project.name}</span>
          ) : (
            project.name
          )}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {project.description}
        </p>
      </div>
    </div>
  );

  return (
    <div className="group">
      {project.url ? (
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {body}
        </a>
      ) : (
        body
      )}
      {project.embed && <div className="mt-4">{project.embed}</div>}
    </div>
  );
}

type ExpandableSectionProps<T> = {
  title: string;
  items: T[];
  itemKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  visibleCount?: number;
};

function ExpandableSection<T>({
  title,
  items,
  itemKey,
  renderItem,
  visibleCount = DEFAULT_VISIBLE_COUNT,
}: ExpandableSectionProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = useId();
  const hasMore = items.length > visibleCount;
  const visibleItems = items.slice(0, visibleCount);
  const extraItems = items.slice(visibleCount);

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

function BrazilTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Reserve the line's height before mount to avoid layout shift
  if (!now) {
    return <p className="text-sm text-muted-foreground mb-8 h-5" aria-hidden />;
  }

  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: "America/Sao_Paulo",
    }).format(now),
  );
  const flavor =
    hour >= 23 || hour < 5
      ? " — I should be asleep."
      : hour < 7
        ? " — the coffee is fresh."
        : ".";

  return (
    <p className="text-sm text-muted-foreground mb-8">
      It&apos;s {time} for me in Brazil{flavor}
    </p>
  );
}

function stagger(step: number): CSSProperties {
  return { "--stagger": step } as CSSProperties;
}

export default function HomeClient() {
  useEffect(() => {
    console.log("%chey, fellow dev 👋", "font-size:14px;font-weight:600;");
    console.log(
      "Try dragging the clock in the top-right corner — you can scrub through the day.\n" +
        "And if you still remember the Konami code… it works here. (↑ ↑ ↓ ↓ ← → ← → B A)\n" +
        "There's also a guitar tuner hiding next to the clock. Bring an instrument.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[640px] mx-auto px-6 py-16 sm:py-24">
        <header
          className="flex items-center justify-between mb-6 animate-enter"
          style={stagger(0)}
        >
          <h1 className="text-2xl font-bold text-foreground">Pedro Barretto</h1>
          <div className="flex items-center gap-3">
            <MusicNoteEasterEgg />
            <ClockTheme />
          </div>
        </header>

        <p
          className="text-muted-foreground mb-16 animate-enter"
          style={stagger(1)}
        >
          Software engineer in Brazil, working remotely for{" "}
          <a
            href="https://ingenious.agency/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-muted-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Ingenious Agency
          </a>{" "}
          and doing AI consulting for{" "}
          <a
            href="https://www.poscontrole.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline decoration-muted-foreground/60 underline-offset-4 transition-colors hover:decoration-foreground"
          >
            POS Controle
          </a>
          . Nights and weekends, I ship my own things: AI attendants on
          WhatsApp, a calm habit tracker, small tools that scratch my own itch.
        </p>

        <div className="animate-enter" style={stagger(2)}>
          <ExpandableSection
            title="Projects"
            items={projects}
            itemKey={(project) => project.name}
            renderItem={(project) => <ProjectItem project={project} />}
            visibleCount={4}
          />
        </div>

        <footer className="pt-8 animate-enter" style={stagger(3)}>
          <BrazilTime />
          <div className="flex items-center gap-5">
            {socials.map((social) => (
              <a
                key={social.label}
                href={social.url}
                {...(social.url.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                aria-label={social.label}
                title={social.label}
                className="transition-transform duration-150 active:scale-95"
              >
                <Image
                  src={social.icon}
                  alt=""
                  width={20}
                  height={20}
                  className={[
                    "size-5 rounded-[5px] sm:grayscale sm:opacity-70 transition-[filter,opacity] duration-300 sm:hover:grayscale-0 sm:hover:opacity-100",
                    social.darkInvert ? "dark:invert" : "",
                  ]
                    .join(" ")
                    .trim()}
                />
              </a>
            ))}
          </div>
        </footer>
      </main>
    </div>
  );
}
