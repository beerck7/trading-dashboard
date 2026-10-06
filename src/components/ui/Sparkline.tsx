// Simplified from corona's Sparkline: a decorative trend with a textual change beside it.
export function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const range = Math.max(...data) - min || 1;
  const points = data.map((value, index) => `${index / (data.length - 1) * 112},${36 - (value - min) / range * 30}`).join(" ");
  return <svg viewBox="0 0 112 42" className={`sparkline ${positive ? "positive" : "negative"}`} aria-hidden="true"><polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.7" vectorEffect="non-scaling-stroke" /></svg>;
}
