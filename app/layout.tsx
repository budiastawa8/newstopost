import type { Metadata, Viewport } from "next";
import {
  Bebas_Neue,
  DM_Sans,
  Fraunces,
  Geist,
  Manrope,
  Outfit,
  Plus_Jakarta_Sans,
  Space_Grotesk,
  Syne,
} from "next/font/google";
import { AppSerwistProvider } from "@/components/serwist-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const fontVariables = [
  geistSans.variable,
  spaceGrotesk.variable,
  dmSans.variable,
  fraunces.variable,
  plusJakarta.variable,
  syne.variable,
  outfit.variable,
  bebas.variable,
  manrope.variable,
].join(" ");

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

const APP_NAME = "NewsToPost";
const APP_DESCRIPTION =
  "Scrape URL berita, ringkas dengan Gemini, dan unduh slide carousel Instagram sebagai PNG.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: APP_NAME,
  title: {
    default: "NewsToPost — Carousel Instagram dari Berita",
    template: "%s · NewsToPost",
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: "NewsToPost",
    description: APP_DESCRIPTION,
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "NewsToPost" }],
  },
  twitter: {
    card: "summary",
    title: "NewsToPost",
    description: APP_DESCRIPTION,
    images: ["/logo.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-[radial-gradient(ellipse_at_top,_#f0fdfa_0%,_#fafafa_45%,_#f4f4f5_100%)] font-[family-name:var(--font-geist-sans)] text-zinc-900">
        <AppSerwistProvider>{children}</AppSerwistProvider>
      </body>
    </html>
  );
}
