import type { Metadata, Viewport } from "next";

import { fontVars } from "@/lib/fonts";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Cash, Chaos & Code — The Ultimate Heist — GDG Chitkara",
    template: "%s — Cash, Chaos & Code",
  },
  description:
    "Cash, Chaos & Code — The Ultimate Heist: a GTA-style campus takeover by GDG Chitkara. Run missions, earn cash, dodge the Police and fight into the Big Heist.",
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
