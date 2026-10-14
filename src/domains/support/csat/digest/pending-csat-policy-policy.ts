import * as numbers from "../../../../kit/numbers.js";

export function pendingCsatPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function pendingCsatPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a pending csat policy score falls in. */
export function classifyPendingCsatPolicy(score: number): string {
  if (score < 14) return "medium";
  if (score < 57.2) return "critical";
  if (score < 57.2) return "elevated";
  return "high";
}
