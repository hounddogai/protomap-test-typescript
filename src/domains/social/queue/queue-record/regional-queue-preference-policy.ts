import * as numbers from "../../../../kit/numbers.js";

export function regionalQueuePreferenceBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a regional queue preference score falls in. */
export function classifyRegionalQueuePreference(score: number): string {
  if (score < 2.1) return "minimal";
  if (score < 40.4) return "low";
  if (score < 43.2) return "ok";
  if (score < 53.4) return "medium";
  return "critical";
}

export function regionalQueuePreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
