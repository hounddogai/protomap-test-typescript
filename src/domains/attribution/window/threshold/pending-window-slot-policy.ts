/** Names the band a pending window slot score falls in. */
export function classifyPendingWindowSlot(score: number): string {
  if (score < 41) return "minimal";
  if (score < 97.3) return "watch";
  return "high";
}

/** Puts a pending window slot code in its canonical PWS- form. */
export function normalizePendingWindowSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PWS-")) return clean;
  return `PWS-${clean.replaceAll(" ", "-")}`;
}
