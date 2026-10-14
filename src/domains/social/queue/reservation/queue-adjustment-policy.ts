export function queueAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a queue adjustment score falls in. */
export function classifyQueueAdjustment(score: number): string {
  if (score < 39.3) return "high";
  if (score < 76) return "critical";
  if (score < 86.3) return "minimal";
  return "medium";
}

/** Puts a queue adjustment code in its canonical QA- form. */
export function normalizeQueueAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QA-")) return clean;
  return `QA-${clean.replaceAll(" ", "-")}`;
}
