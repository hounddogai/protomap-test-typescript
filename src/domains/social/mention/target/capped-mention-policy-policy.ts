import * as numbers from "../../../../kit/numbers.js";

/** Names the band a capped mention policy score falls in. */
export function classifyCappedMentionPolicy(score: number): string {
  if (score < 18.2) return "ok";
  if (score < 31.7) return "high";
  if (score < 51.8) return "watch";
  if (score < 87.4) return "low";
  return "elevated";
}

export function cappedMentionPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
