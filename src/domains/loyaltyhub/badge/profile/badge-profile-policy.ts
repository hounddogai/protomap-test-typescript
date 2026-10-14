import * as numbers from "../../../../kit/numbers.js";

export function badgeProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function badgeProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Names the band a badge profile score falls in. */
export function classifyBadgeProfile(score: number): string {
  if (score < 20.9) return "minimal";
  if (score < 83.4) return "medium";
  return "low";
}
