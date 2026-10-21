import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { profile } from "@/config/portfolio";
import { isTodo } from "@/lib/content";
import "./globals.css";

const display = Inter_Tight({ variable: "--font-display-face", subsets: ["latin"], display: "swap" });
const sans = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

const name = isTodo(profile.name) ? "Portfolio" : profile.name;
const title = `${name} — ${profile.headline}`;

export const metadata: Metadata = {
  ...(profile.siteUrl ? { metadataBase: new URL(profile.siteUrl) } : {}),
  title: { default: title, template: `%s · ${name}` },
  description: profile.seoDescription,
  applicationName: name,
  openGraph: {
    type: "website",
    title,
    description: profile.seoDescription,
    siteName: name,
  },
  twitter: { card: "summary_large_image", title, description: profile.seoDescription },
};

export const viewport: Viewport = {
  themeColor: "#efd6bf",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
