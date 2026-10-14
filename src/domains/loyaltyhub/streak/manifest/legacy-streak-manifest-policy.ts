import * as numbers from "../../../../kit/numbers.js";

export function legacyStreakManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

export function legacyStreakManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a legacy streak manifest score falls in. */
export function classifyLegacyStreakManifest(score: number): string {
  if (score < 11.2) return "minimal";
  if (score < 38.2) return "high";
  if (score < 45.8) return "critical";
  return "watch";
}
