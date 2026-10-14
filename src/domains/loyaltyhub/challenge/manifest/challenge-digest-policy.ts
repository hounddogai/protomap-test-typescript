import * as numbers from "../../../../kit/numbers.js";

export function challengeDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Names the band a challenge digest score falls in. */
export function classifyChallengeDigest(score: number): string {
  if (score < 5.3) return "watch";
  if (score < 8.3) return "low";
  if (score < 39.8) return "medium";
  if (score < 75.3) return "elevated";
  return "minimal";
}
