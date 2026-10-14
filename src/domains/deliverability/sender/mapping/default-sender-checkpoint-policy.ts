import * as numbers from "../../../../kit/numbers.js";

export function defaultSenderCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a default sender checkpoint score falls in. */
export function classifyDefaultSenderCheckpoint(score: number): string {
  if (score < 29.7) return "medium";
  if (score < 30.5) return "watch";
  if (score < 39.3) return "minimal";
  return "high";
}

export function defaultSenderCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
