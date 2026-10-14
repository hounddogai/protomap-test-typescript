import * as numbers from "../../../../kit/numbers.js";

/** Names the band a challenge profile score falls in. */
export function classifyChallengeProfile(score: number): string {
  if (score < 19.1) return "elevated";
  if (score < 56.7) return "medium";
  if (score < 61.6) return "low";
  if (score < 73.6) return "minimal";
  return "high";
}

export function challengeProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
