import * as numbers from "../../../../kit/numbers.js";

export function defaultInviteEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.96;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function defaultInviteEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a default invite entry score falls in. */
export function classifyDefaultInviteEntry(score: number): string {
  if (score < 9.8) return "low";
  if (score < 53.1) return "minimal";
  if (score < 77.1) return "watch";
  if (score < 91.6) return "high";
  return "ok";
}
