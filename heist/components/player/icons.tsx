type P = { size?: number };
const s = (size = 18) => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const });

export const Coin = ({ size }: P) => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="10" fill="#dcab3c" />
    <circle cx="12" cy="12" r="7.4" fill="none" stroke="#a8741a" strokeWidth="1.5" />
    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7a5410">$</text>
  </svg>
);
export const Bolt = ({ size, color = "#e5d9bb" }: P & { color?: string }) => (
  <svg {...s(size)}><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill={color} /></svg>
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
  <svg className="caret" width="12" height="12" viewBox="0 0 24 24" aria-hidden><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
);
export const Pin = ({ size }: P) => (
  <svg {...s(size ?? 12)}><path d="M14.5 2.5 21.5 9.5l-2 1-3 3-.5 4.5-1.5 1.5-3.5-3.5-5.5 5.5-1-1 5.5-5.5L6.5 11.5 8 10l4.5-.5 3-3z" fill="currentColor" /></svg>
);
export const Bell = ({ size }: P) => (
  <svg {...s(size)}><path d="M12 2a6 6 0 0 0-6 6v3.6L4.2 15a1 1 0 0 0 .9 1.5h13.8a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6zm0 20a2.6 2.6 0 0 0 2.5-2h-5A2.6 2.6 0 0 0 12 22z" fill="currentColor" /></svg>
);
export const Share = ({ size }: P) => (
  <svg {...s(size)}><path d="M12 3 7.5 7.5l1.4 1.4L11 6.8V15h2V6.8l2.1 2.1 1.4-1.4zM5 11v9h14v-9h-2v7H7v-7z" fill="currentColor" /></svg>
);
export const Trophy = ({ size }: P) => (
  <svg {...s(size)}><path d="M7 3h10v2h3v3a4 4 0 0 1-3.6 4A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 7.6 12 4 4 0 0 1 4 8V5h3zm-1 4v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 9V7zm12 0h-1v2a5 5 0 0 1-.2.8A2 2 0 0 0 18 8zM8 21h8v1H8z" fill="currentColor" /></svg>
);
export const Key = ({ size }: P) => (
  <svg {...s(size)}><path d="M8 13a5 5 0 1 1 4.6-7H22v4h-2v3h-3v-3h-4.4A5 5 0 0 1 8 13zm0-7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" fill="currentColor" /></svg>
);
export const Exit = ({ size }: P) => (
  <svg {...s(size)}><path d="M5 3h8v2H7v14h6v2H5zm11 4 5 5-5 5-1.4-1.4L17.2 13H9v-2h8.2l-2.6-2.6z" fill="currentColor" /></svg>
);
export const LogIn = ({ size }: P) => (
  <svg {...s(size)}><path d="M11 7l5 5-5 5-1.4-1.4L12.2 13H3v-2h9.2L9.6 8.4zM14 3h7v18h-7v-2h5V5h-5z" fill="currentColor" /></svg>
);
