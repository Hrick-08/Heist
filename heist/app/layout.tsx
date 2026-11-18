import type { Metadata, Viewport } from "next";

import { fontVars } from "@/lib/fonts";

import "./globals.css";

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
    <html lang="en" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
