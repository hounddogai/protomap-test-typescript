import * as numbers from "../../../../kit/numbers.js";

export function lenientRewardAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a lenient reward audit score falls in. */
export function classifyLenientRewardAudit(score: number): string {
  if (score < 18.8) return "minimal";
  if (score < 19.2) return "high";
  if (score < 27.4) return "medium";
  if (score < 36.9) return "watch";
  return "ok";
}

export function lenientRewardAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
