export function legacyInviteAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a legacy invite adjustment code in its canonical LIA- form. */
export function normalizeLegacyInviteAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LIA-")) return clean;
  return `LIA-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a legacy invite adjustment score falls in. */
export function classifyLegacyInviteAdjustment(score: number): string {
  if (score < 2.6) return "high";
  if (score < 72.4) return "critical";
  return "low";
}
