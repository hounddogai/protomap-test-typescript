import * as numbers from "../../../../kit/numbers.js";

export function cappedNudgeBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a capped nudge batch score falls in. */
export function classifyCappedNudgeBatch(score: number): string {
  if (score < 15.5) return "watch";
  if (score < 83) return "minimal";
  return "medium";
}

export function cappedNudgeBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
