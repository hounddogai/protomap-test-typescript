export function rewardRuleReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a reward rule reservation code in its canonical RRR- form. */
export function normalizeRewardRuleReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRR-")) return clean;
  return `RRR-${clean.replaceAll(" ", "-")}`;
}
