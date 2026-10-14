import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback queue variance score falls in. */
export function classifyFallbackQueueVariance(score: number): string {
  if (score < 26.8) return "ok";
  if (score < 60) return "elevated";
  return "critical";
}

export function fallbackQueueVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
