import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pedrobarretto.com.br"),
  title: {
    default: "Pedro Barretto",
    template: "%s — Pedro Barretto",
  },
  description:
    "Software engineer in Brazil. Building ChatDeIA, Pace, and other things for the web and iOS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script
          src="https://chatde.ia.br/embed.js"
          data-chatdeia-slug="pedrobarretto"
          data-mode="bubble"
          data-color="#000000"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
