import * as numbers from "../../../../kit/numbers.js";

export function defaultTouchpointRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function defaultTouchpointRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a default touchpoint record score falls in. */
export function classifyDefaultTouchpointRecord(score: number): string {
  if (score < 29.8) return "elevated";
  if (score < 31.9) return "critical";
  if (score < 69.5) return "minimal";
  if (score < 86.7) return "medium";
  return "high";
}
