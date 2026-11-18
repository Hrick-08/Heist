import localFont from "next/font/local";

/*
 * Self-hosted from the @fontsource packages, so builds and page loads never
 * depend on Google Fonts being reachable. One instance is shared by the player
 * app and every public page.
 */
export const display = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/bowlby-one/files/bowlby-one-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-pl-display",
  display: "swap",
});

export const body = localFont({
  src: [
    { path: "../node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../node_modules/@fontsource/barlow-semi-condensed/files/barlow-semi-condensed-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-pl-body",
  display: "swap",
});

export const fontVars = `${display.variable} ${body.variable}`;
