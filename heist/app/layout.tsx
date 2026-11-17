import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { fontVars } from "@/lib/fonts";

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
  title: {
    default: "The Last Heist — GDG Chitkara",
    template: "%s — The Last Heist",
  },
  description:
    "The Last Heist: a GTA 6 themed campus heist event by GDG Chitkara. Collect points, buy clues, and empty the vault.",
};

export const viewport: Viewport = {
  themeColor: "#1c1e20",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fontVars} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
