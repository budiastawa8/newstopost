import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "NewsToPost — Carousel Instagram dari Berita",
  description:
    "Scrape URL berita, ringkas dengan Gemini, dan unduh slide carousel Instagram sebagai PNG.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-[radial-gradient(ellipse_at_top,_#f0fdfa_0%,_#fafafa_45%,_#f4f4f5_100%)] font-[family-name:var(--font-geist-sans)] text-zinc-900">
        {children}
      </body>
    </html>
  );
}
