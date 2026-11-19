type P = { size?: number };
const s = (size = 18) => ({ width: size, height: size, viewBox: "0 0 24 24", "aria-hidden": true as const });
const I = (d: string) => function Icon({ size }: P) { return <svg {...s(size)}><path d={d} fill="currentColor" /></svg>; };

export const Coin = ({ size }: P) => (
  <svg {...s(size)}>
    <circle cx="12" cy="12" r="10" fill="#dcab3c" />
    <circle cx="12" cy="12" r="7.4" fill="none" stroke="#a8741a" strokeWidth="1.5" />
    <text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="700" fill="#7a5410">$</text>
  </svg>
);
export const Bolt = ({ size, color = "#e5d9bb" }: P & { color?: string }) => <svg {...s(size)}><path d="M13 2 4 14h6l-1 8 9-12h-6z" fill={color} /></svg>;
export const Crown = ({ size }: P) => <svg {...s(size)}><path d="M3.5 18 2.5 7l5 4 4.5-7 4.5 7 5-4-1 11zM4 20h16v2H4z" fill="currentColor" /></svg>;

export const GridIcon = I("M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z");
export const CheckIcon = I("M9 16.2 4.8 12l-1.8 1.8L9 19.8 21 7.8 19.2 6z");
export const CrewIcon = I("M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-3.3 0-7 1.7-7 4v3h14v-3c0-2.3-3.7-4-7-4zm8 0c-.5 0-1 0-1.5.1 1.5 1 2.5 2.3 2.5 3.9v3h5v-3c0-2-3.2-4-6-4z");
export const ListIcon = I("M4 5h3v3H4zm5 .5h11v2H9zM4 10.5h3v3H4zm5 .5h11v2H9zM4 16h3v3H4zm5 .5h11v2H9z");
export const ShadesIcon = I("M2 9h20v2l-1 1v2.5a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V12h-2v2.5a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V12l-1-1z");
export const FlagIcon = I("M5 3h2v18H5zM8 4h11l-2.5 4L19 12H8z");
export const SlidersIcon = I("M4 6h10v2H4zm12-1h4v4h-4zM4 11h4v2H4zm6-1h10v4H10zM4 16h12v2H4zm14-1h2v4h-2z");
export const PlusIcon = I("M11 4h2v7h7v2h-7v7h-2v-7H4v-2h7z");
export const ArrowIcon = I("M5 11h11.2l-4.6-4.6L13 5l7 7-7 7-1.4-1.4 4.6-4.6H5z");
export const ShieldIcon = I("M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z");
export const Caret = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>
);
export const SearchIcon = ({ size = 18 }: P) => <svg {...s(size)}><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2.4" /><path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>;
export const EditIcon = I("M3 17.2V21h3.8L18 9.8 14.2 6zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8L19 8.8z");
export const TrashIcon = I("M6 7h12l-1 14H7zM9 3h6l1 2h4v2H4V5h4z");
export const StarIcon = I("M12 2l3 7 7.5.6-5.7 4.9 1.8 7.3-6.6-4-6.6 4 1.8-7.3L1.5 9.6 9 9z");
export const CopyIcon = I("M8 3h11v14H8zM4 7h2v12h11v2H4z");
export const BellIcon = I("M12 2a6 6 0 0 0-6 6v3.6L4.2 15a1 1 0 0 0 .9 1.5h13.8a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6zm0 20a2.6 2.6 0 0 0 2.5-2h-5A2.6 2.6 0 0 0 12 22z");
export const ExitIcon = I("M5 3h8v2H7v14h6v2H5zm11 4 5 5-5 5-1.4-1.4L17.2 13H9v-2h8.2l-2.6-2.6z");
export const TrophyIcon = I("M7 3h10v2h3v3a4 4 0 0 1-3.6 4A5 5 0 0 1 13 14.9V17h3v2H8v-2h3v-2.1A5 5 0 0 1 7.6 12 4 4 0 0 1 4 8V5h3zm-1 4v1a2 2 0 0 0 1.2 1.8A5 5 0 0 1 7 9V7zm12 0h-1v2a5 5 0 0 1-.2.8A2 2 0 0 0 18 8zM8 21h8v1H8z");
export const UndoIcon = I("M12.5 8c-2.7 0-5.1 1-6.9 2.6L2 7v9h9l-3.6-3.6A8 8 0 0 1 12.5 10c3.5 0 6.5 2.3 7.6 5.5l2.4-.8C21.1 10.6 17.1 8 12.5 8z");
export const CrownIcon = I("M3.5 18 2.5 7l5 4 4.5-7 4.5 7 5-4-1 11zM4 20h16v2H4z");
export const InboxIcon = I("M4 4h16l2 8v8H2v-8zm1.8 2L4.3 12H9l1 2h4l1-2h4.7L18.2 6zM4 14v4h16v-4h-3.8l-1 2H8.8l-1-2z");
export const KeyIcon = I("M7.5 14a4.5 4.5 0 1 1 4.3-5.8H22v3.3h-2.2v2.4h-3.3v-2.4h-4.7A4.5 4.5 0 0 1 7.5 14zm0-6.4a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8z");
