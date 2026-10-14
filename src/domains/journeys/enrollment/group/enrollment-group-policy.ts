import * as numbers from "../../../../kit/numbers.js";

export function enrollmentGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function enrollmentGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.41;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a enrollment group score falls in. */
export function classifyEnrollmentGroup(score: number): string {
  if (score < 23.6) return "low";
  if (score < 90.7) return "high";
  return "ok";
}
