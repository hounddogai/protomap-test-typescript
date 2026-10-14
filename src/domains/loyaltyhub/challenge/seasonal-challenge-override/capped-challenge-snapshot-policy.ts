import * as numbers from "../../../../kit/numbers.js";

/** Names the band a capped challenge snapshot score falls in. */
export function classifyCappedChallengeSnapshot(score: number): string {
  if (score < 7.4) return "elevated";
  if (score < 34.9) return "watch";
  if (score < 73.7) return "high";
  if (score < 93.8) return "low";
  return "medium";
}

export function cappedChallengeSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
