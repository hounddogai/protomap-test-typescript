import * as numbers from "../../../../kit/numbers.js";

export function bounceScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a bounce score score falls in. */
export function classifyBounceScore(score: number): string {
  if (score < 1.8) return "minimal";
  if (score < 12.7) return "medium";
  if (score < 89.1) return "ok";
  if (score < 91.9) return "low";
  return "watch";
}
