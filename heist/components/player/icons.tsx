type P = { size?: number };
const s = (size = 18) => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const });

export const Coin = ({ size }: P) => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="10" fill="#dcab3c" />
    <circle cx="12" cy="12" r="7.4" fill="none" stroke="#a8741a" strokeWidth="1.5" />
    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7a5410">$</text>
  </svg>
);
export const Bolt = ({ size }: P) => (
  <svg {...s(size)}><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill="#e5d9bb" /></svg>
);
export const Crown = ({ size }: P) => (
  <svg {...s(size)}><path d="M3.5 18 2.5 7l5 4 4.5-7 4.5 7 5-4-1 11zM4 20h16v2H4z" fill="currentColor" /></svg>
);
export const HomeIcon = ({ size }: P) => (
  <svg {...s(size)}><path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z" fill="currentColor" /></svg>
);
export const RankIcon = ({ size }: P) => (
  <svg {...s(size)}><path d="M3 12h5v9H3zM9.5 4h5v17h-5zM16 15h5v6h-5z" fill="currentColor" /></svg>
);
export const Caret = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
);
export const Pin = ({ size }: P) => (
  <svg {...s(size ?? 12)}><path d="M14.5 2.5 21.5 9.5l-2 1-3 3-.5 4.5-1.5 1.5-3.5-3.5-5.5 5.5-1-1 5.5-5.5L6.5 11.5 8 10l4.5-.5 3-3z" fill="currentColor" /></svg>
);
