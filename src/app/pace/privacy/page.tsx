export default function PrivacyPage() {
	return (
		<div className="min-h-screen bg-background">
			<main className="max-w-[640px] mx-auto px-6 py-16 sm:py-24">
				<h1 className="text-2xl font-bold text-foreground mb-6">
					Privacy Policy
				</h1>

				<p className="text-foreground mb-4">
					<strong>Pace</strong> respects your privacy.
				</p>
				<p className="text-muted-foreground mb-8">
					This app is designed to work <strong className="text-foreground">100% offline</strong>. We do not collect, store, transmit, or share personal data.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Data Collection</h2>
				<p className="text-muted-foreground mb-2">Pace does <strong className="text-foreground">not</strong> collect:</p>
				<ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
					<li>Personal information</li>
					<li>Usage analytics</li>
					<li>Tracking data</li>
					<li>Location data</li>
					<li>Contacts or photos</li>
				</ul>
				<p className="text-muted-foreground mb-8">
					No accounts or logins are required. All habits, logs, and preferences are stored <strong className="text-foreground">locally on your device only</strong>.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Data Storage</h2>
				<ul className="list-disc list-inside text-muted-foreground mb-8 space-y-1">
					<li>Your data never leaves your device.</li>
					<li>Deleting the app permanently deletes all stored data.</li>
					<li>Pace does not provide cloud backup or recovery.</li>
				</ul>

				<h2 className="text-xl font-semibold text-foreground mb-4">Subscriptions</h2>
				<p className="text-muted-foreground mb-2">
					Subscriptions are processed by Apple through In-App Purchases.
				</p>
				<p className="text-muted-foreground mb-2">Pace does not have access to:</p>
				<ul className="list-disc list-inside text-muted-foreground mb-4 space-y-1">
					<li>Your Apple ID</li>
					<li>Payment details</li>
					<li>Billing information</li>
				</ul>
				<p className="text-muted-foreground mb-8">
					Apple may provide anonymous subscription status information to enable premium features.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Children&apos;s Privacy</h2>
				<p className="text-muted-foreground mb-8">
					Pace is not intended for children under the age of 13 and does not knowingly collect personal information from children.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Changes to This Policy</h2>
				<p className="text-muted-foreground mb-8">
					This Privacy Policy may be updated in the future. Any changes will be reflected on this page.
				</p>

				<h2 className="text-xl font-semibold text-foreground mb-4">Contact</h2>
				<p className="text-muted-foreground mb-2">
					If you have questions about this Privacy Policy, you can contact:
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
