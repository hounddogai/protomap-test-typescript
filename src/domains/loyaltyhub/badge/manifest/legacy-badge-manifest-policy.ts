import * as numbers from "../../../../kit/numbers.js";

/** Names the band a legacy badge manifest score falls in. */
export function classifyLegacyBadgeManifest(score: number): string {
  if (score < 28.9) return "low";
  if (score < 36.1) return "watch";
  if (score < 65.1) return "minimal";
  return "critical";
}

export function legacyBadgeManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function legacyBadgeManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function legacyBadgeManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
