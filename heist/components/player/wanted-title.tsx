/**
 * The big "WANTED" on a poster. Drawn as SVG text with a fixed length, so the word
 * always fills the poster edge to edge: it can never overflow, and it looks the same
 * on every screen.
 */
export function WantedTitle() {
  return (
    <svg className="wp-title" viewBox="0 0 300 66" role="img" aria-label="Wanted">
      <text x="153" y="60" textAnchor="middle" textLength="286" lengthAdjust="spacingAndGlyphs" className="sh">
        WANTED
      </text>
      <text x="150" y="57" textAnchor="middle" textLength="286" lengthAdjust="spacingAndGlyphs">
        WANTED
      </text>
    </svg>
  );
}
