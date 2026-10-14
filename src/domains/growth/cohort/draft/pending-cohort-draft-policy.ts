/** Names the band a pending cohort draft score falls in. */
export function classifyPendingCohortDraft(score: number): string {
  if (score < 39.8) return "medium";
  if (score < 41.4) return "low";
  return "watch";
}

/** Puts a pending cohort draft code in its canonical PCD- form. */
export function normalizePendingCohortDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PCD-")) return clean;
  return `PCD-${clean.replaceAll(" ", "-")}`;
}

export function pendingCohortDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
