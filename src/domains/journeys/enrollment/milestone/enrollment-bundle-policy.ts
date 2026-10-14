import * as numbers from "../../../../kit/numbers.js";

export function enrollmentBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function enrollmentBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a enrollment bundle score falls in. */
export function classifyEnrollmentBundle(score: number): string {
  if (score < 58.2) return "low";
  if (score < 95.9) return "medium";
  return "minimal";
}
