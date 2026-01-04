export default function SupportPage() {
	return (
		<div className="min-h-screen bg-background">
			<main className="max-w-[640px] mx-auto px-6 py-16 sm:py-24">
				<h1 className="text-2xl font-bold text-foreground mb-6">Support</h1>

				<p className="text-foreground mb-4">
					Thanks for using <strong>Pace</strong>.
				</p>
				<p className="text-muted-foreground mb-8">
					If you need help, have questions, or want to report an issue, you can contact us using the information below.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Contact</h2>
				<ul className="list-disc list-inside text-muted-foreground mb-8 space-y-1">
					<li>Email: <strong className="text-foreground">pedro@barretto.com.br</strong></li>
					<li>WhatsApp: <strong className="text-foreground">+55 11 93619-9546</strong></li>
				</ul>

				<h2 className="text-xl font-semibold text-foreground mb-4">Common Questions</h2>

				<h3 className="text-lg font-medium text-foreground mb-2">Is Pace offline?</h3>
				<p className="text-muted-foreground mb-6">
					Yes. Pace is designed to work completely offline. No data is sent to servers.
				</p>

				<h3 className="text-lg font-medium text-foreground mb-2">What happens if I delete the app?</h3>
				<p className="text-muted-foreground mb-6">
					All data is stored locally. Deleting the app permanently removes your habits and logs.
				</p>

				<h3 className="text-lg font-medium text-foreground mb-2">How do I restore my subscription?</h3>
				<p className="text-muted-foreground mb-6">
					If you reinstall the app or change devices, use the <strong className="text-foreground">Restore Purchases</strong> option in the app. Apple manages subscription restoration.
				</p>

				<h3 className="text-lg font-medium text-foreground mb-2">I changed phones. Can I recover my data?</h3>
				<p className="text-muted-foreground mb-8">
					Pace does not offer cloud sync. Data recovery depends on your device&apos;s system backups.
				</p>

				<hr className="border-muted-foreground/20 mb-8" />

				<p className="text-muted-foreground mb-4">
					We aim to respond as soon as possible.
				</p>

				<p className="text-sm text-muted-foreground">
					<strong>Last updated:</strong> January 2025
				</p>
			</main>
		</div>
	);
}
