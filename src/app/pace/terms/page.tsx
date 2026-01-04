export default function TermsPage() {
	return (
		<div className="min-h-screen bg-background">
			<main className="max-w-[640px] mx-auto px-6 py-16 sm:py-24">
				<h1 className="text-2xl font-bold text-foreground mb-6">
					Terms of Service
				</h1>

				<p className="text-foreground mb-4">
					Welcome to <strong>Pace</strong>.
				</p>
				<p className="text-muted-foreground mb-8">
					By downloading or using this app, you agree to these Terms of Service. If you do not agree, please do not use the app.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Description of the App</h2>
				<p className="text-muted-foreground mb-4">
					Pace is a habit-tracking app that helps you build consistency over time using visual progress indicators.
				</p>
				<p className="text-muted-foreground mb-8">
					The app works <strong className="text-foreground">entirely offline</strong>. All data is stored locally on your device.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Eligibility</h2>
				<p className="text-muted-foreground mb-8">
					You must be at least <strong className="text-foreground">13 years old</strong> to use Pace.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Subscriptions</h2>
				<p className="text-muted-foreground mb-2">
					Some features of Pace require a paid subscription.
				</p>
				<ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
					<li>Subscriptions are billed through your Apple ID.</li>
					<li>Payment is charged at confirmation of purchase.</li>
					<li>Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.</li>
					<li>You can manage or cancel subscriptions in your App Store account settings.</li>
				</ul>
				<p className="text-muted-foreground mb-8">
					Pace does not handle payments directly and does not offer refunds. Refunds are managed by Apple according to their policies.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Offline Data Responsibility</h2>
				<p className="text-muted-foreground mb-2">Because all data is stored locally:</p>
				<ul className="list-disc list-inside text-muted-foreground mb-8 space-y-1">
					<li>Uninstalling the app deletes all data permanently.</li>
					<li>Data may be lost if your device is reset, lost, or damaged.</li>
					<li>Pace cannot recover deleted data.</li>
				</ul>

				<h2 className="text-xl font-semibold text-foreground mb-4">Acceptable Use</h2>
				<p className="text-muted-foreground mb-8">
					You agree to use Pace only for lawful purposes and not to attempt to reverse engineer, modify, or disrupt the app.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Intellectual Property</h2>
				<p className="text-muted-foreground mb-8">
					All content, design, and code in Pace are the property of its developer. You are granted a limited, personal, non-transferable license to use the app.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Disclaimer</h2>
				<p className="text-muted-foreground mb-8">
					Pace is provided &quot;as is&quot;, without warranties of any kind. We do not guarantee uninterrupted or error-free operation.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Limitation of Liability</h2>
				<p className="text-muted-foreground mb-8">
					To the maximum extent permitted by law, the developer of Pace is not liable for indirect or consequential damages arising from the use or inability to use the app.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Changes to These Terms</h2>
				<p className="text-muted-foreground mb-8">
					These Terms may be updated from time to time. Continued use of the app means you accept the updated Terms.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Contact</h2>
				<p className="text-muted-foreground mb-2">
					For questions about these Terms, contact:
				</p>
				<ul className="list-disc list-inside text-muted-foreground mb-8 space-y-1">
					<li>Email: <strong className="text-foreground">pedro@barretto.com.br</strong></li>
					<li>WhatsApp: <strong className="text-foreground">+55 11 93619-9546</strong></li>
				</ul>

				<p className="text-sm text-muted-foreground">
					<strong>Last updated:</strong> January 2025
				</p>
			</main>
		</div>
	);
}
