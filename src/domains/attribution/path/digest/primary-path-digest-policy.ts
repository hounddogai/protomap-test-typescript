import * as numbers from "../../../../kit/numbers.js";

export function primaryPathDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a primary path digest score falls in. */
export function classifyPrimaryPathDigest(score: number): string {
  if (score < 32.9) return "minimal";
  if (score < 34.8) return "medium";
  if (score < 96.2) return "ok";
  return "elevated";
}
