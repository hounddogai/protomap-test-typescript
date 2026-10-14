import * as numbers from "../../../../kit/numbers.js";

export function fraudCheckDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a fraud check digest score falls in. */
export function classifyFraudCheckDigest(score: number): string {
  if (score < 17.9) return "elevated";
  if (score < 60.7) return "minimal";
  return "low";
}
