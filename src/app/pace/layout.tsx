import type { CSSProperties } from "react";

const lightThemeStyles: CSSProperties & Record<string, string> = {
	"--background": "#f5f5f5",
	"--foreground": "#171717",
	"--card": "#f5f5f5",
	"--card-foreground": "#171717",
	"--popover": "#f5f5f5",
	"--popover-foreground": "#171717",
	"--primary": "#171717",
	"--primary-foreground": "#f5f5f5",
	"--secondary": "#e5e5e5",
	"--secondary-foreground": "#171717",
	"--muted": "#e5e5e5",
	"--muted-foreground": "#a3a3a3",
	"--accent": "#e5e5e5",
	"--accent-foreground": "#171717",
	"--destructive": "#dc2626",
	"--border": "#d4d4d4",
	"--input": "#d4d4d4",
	"--ring": "#a3a3a3",
};

export default function PaceLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <div style={lightThemeStyles}>{children}</div>;
}
