import * as numbers from "../../../../kit/numbers.js";

export function approvalDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function approvalDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function approvalDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.75;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a approval digest score falls in. */
export function classifyApprovalDigest(score: number): string {
  if (score < 24.8) return "critical";
  if (score < 26) return "elevated";
  if (score < 56.5) return "low";
  if (score < 61.2) return "ok";
  return "minimal";
}
