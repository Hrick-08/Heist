import { Barlow_Semi_Condensed, Bowlby_One } from "next/font/google";

/** One font instance shared by the player app and every public page. */
export const display = Bowlby_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pl-display",
});

export const body = Barlow_Semi_Condensed({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-pl-body",
});

export const fontVars = `${display.variable} ${body.variable}`;
