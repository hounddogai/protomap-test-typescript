import * as numbers from "../../../../kit/numbers.js";

export function fallbackStreakTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a fallback streak target score falls in. */
export function classifyFallbackStreakTarget(score: number): string {
  if (score < 4.1) return "watch";
  if (score < 41.5) return "ok";
  if (score < 67.7) return "elevated";
  if (score < 90) return "minimal";
  return "critical";
}
