import Image from "next/image";
import Link from "next/link";

export default function PacePage() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<main className="text-center px-6">
				<Image
					src="/grid-icon.png"
					alt="Pace App Icon"
					width={120}
					height={120}
					className="mx-auto rounded-[24px]"
				/>
				<h1 className="text-2xl font-bold text-foreground mt-6">Pace</h1>
				<nav className="mt-8 flex flex-col gap-4">
					<Link
						href="/pace/support"
						className="text-muted-foreground hover:text-foreground transition-colors link-underline"
					>
						Support
					</Link>
					<Link
						href="/pace/terms"
						className="text-muted-foreground hover:text-foreground transition-colors link-underline"
					>
						Terms of Service
					</Link>
					<Link
						href="/pace/privacy"
						className="text-muted-foreground hover:text-foreground transition-colors link-underline"
					>
						Privacy Policy
					</Link>
				</nav>
			</main>
		</div>
	);
}
