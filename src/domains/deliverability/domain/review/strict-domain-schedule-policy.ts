import * as numbers from "../../../../kit/numbers.js";

export function strictDomainScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function strictDomainScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}

/** Names the band a strict domain schedule score falls in. */
export function classifyStrictDomainSchedule(score: number): string {
  if (score < 6.9) return "minimal";
  if (score < 37.1) return "high";
  if (score < 58.7) return "critical";
  if (score < 94.6) return "low";
  return "medium";
}

export function strictDomainScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
