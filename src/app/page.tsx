import { ClockTheme } from "@/components/clock-theme";
import Link from "next/link";

// Data types
type Project = {
	name: string;
	description: string;
	url?: string;
};

type ThoughtPost = {
	title: string;
	description: string;
	slug: string;
};

type CoolLink = {
	title: string;
	description: string;
	url: string;
};

// Placeholder data
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

const thoughts: ThoughtPost[] = [
	{
		title: "Coming soon",
		description:
			"I'll share my thoughts on software, life, and everything in between.",
		slug: "#",
	},
];

const coolLinks: CoolLink[] = [
	{
		title: "It Only Takes Two Weeks",
		description: "This video will change your life. It has changed mine.",
		url: "https://www.youtube.com/watch?v=sZ60bY2pJfo",
	},
	{
		title: "Stripe Press",
		description: "Books I wanna read",
		url: "https://press.stripe.com/",
	},
];

// Section Header Component
function SectionHeader({
	title,
	moreHref,
}: {
	title: string;
	moreHref?: string;
}) {
	return (
		<div className="flex items-center justify-between mb-4">
			<h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
			{moreHref && (
				<Link
					href={moreHref}
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					More
				</Link>
			)}
		</div>
	);
}

// Project Item Component
function ProjectItem({ project }: { project: Project }) {
	const content = (
		<>
			<h3 className="font-medium text-foreground">{project.name}</h3>
			<p className="text-sm text-muted-foreground mt-1">
				{project.description}
			</p>
		</>
	);

	if (project.url) {
		return (
			<a
				href={project.url}
				target="_blank"
				rel="noopener noreferrer"
				className="block hover:opacity-70 transition-opacity"
			>
				{content}
			</a>
		);
	}

	return <div>{content}</div>;
}

// Thought Item Component
function ThoughtItem({ thought }: { thought: ThoughtPost }) {
	return (
		<Link
			href={`/thoughts/${thought.slug}`}
			className="block hover:opacity-70 transition-opacity"
		>
			<h3 className="font-medium text-foreground">{thought.title}</h3>
			<p className="text-sm text-muted-foreground mt-1">
				{thought.description}
			</p>
		</Link>
	);
}

// Cool Link Item Component
function CoolLinkItem({ link }: { link: CoolLink }) {
	return (
		<a
			href={link.url}
			target="_blank"
			rel="noopener noreferrer"
			className="block hover:opacity-70 transition-opacity"
		>
			<h3 className="font-medium text-foreground">{link.title}</h3>
			<p className="text-sm text-muted-foreground mt-1">{link.description}</p>
		</a>
	);
}

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<main className="max-w-[640px] mx-auto px-6 py-16 sm:py-24">
				{/* Header */}
				<header className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold text-foreground">Pedro Barretto</h1>
					<ClockTheme />
				</header>

				{/* Bio */}
				<p className="text-muted-foreground mb-16">
					Brazilian SWE working for 🇺🇸 who loves to code and build cool stuff.
				</p>

				{/* Projects Section */}
				<section className="mb-16">
					<SectionHeader title="Projects" />
					<div className="space-y-6">
						{projects.map((project) => (
							<ProjectItem key={project.name} project={project} />
						))}
					</div>
				</section>

				{/* Thoughts Section */}
				<section className="mb-16">
					<SectionHeader title="Thoughts" />
					<div className="space-y-6">
						{thoughts.map((thought) => (
							<ThoughtItem key={thought.slug} thought={thought} />
						))}
					</div>
				</section>

				{/* Cool Links Section */}
				<section className="mb-16">
					<SectionHeader title="Cool Links" />
					<div className="space-y-6">
						{coolLinks.map((link) => (
							<CoolLinkItem key={link.url} link={link} />
						))}
					</div>
				</section>

				{/* Footer */}
				<footer className="flex items-center gap-6 pt-8">
					<a
						href="https://twitter.com/pedrobarretto_"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="X (Twitter)"
					>
						X
					</a>
					<a
						href="mailto:pedro@barretto.com.br"
						className="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Email"
					>
						Email
					</a>
					<a
						href="https://github.com/pedrobarretto"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="GitHub"
					>
						GitHub
					</a>
					<a
						href="https://linkedin.com/in/pedrobarretto"
						target="_blank"
						rel="noopener noreferrer"
						className="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="LinkedIn"
					>
						LinkedIn
					</a>
				</footer>
			</main>
		</div>
	);
}
