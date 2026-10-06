const paths = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  chart: "M3 3v18h18 M6 15l4-5 4 3 6-8",
  star: "m12 3 2.8 5.7 6.3.9-4.5 4.4 1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  arrow: "M5 16 16 5 M5 5h11v11",
  refresh: "M20 7a9 9 0 0 0-15-2L3 8 M3 3v5h5 M4 17a9 9 0 0 0 15 2l2-3 M21 21v-5h-5",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15 M16 16l5 5",
  chevron: "m9 5 7 7-7 7",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  close: "m6 6 12 12 M6 18 18 6",
  info: "M12 8v.1 M12 11v6 M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18",
  pulse: "M3 17V9 M8 17V4 M13 17v-6 M18 17V7 M23 17V3",
  candle: "M7 3v18 M4 7h6v9H4z M17 3v18 M14 5h6v8h-6z",
  external: "M14 3h7v7 M10 14 21 3 M21 14v7H3V3h7",
} as const;

export function Icon({ name, size = 18, className = "" }: { name: keyof typeof paths; size?: number; className?: string }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}><path d={paths[name]} /></svg>;
}
