import * as numbers from "../../../../kit/numbers.js";

export function creditTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a credit target score falls in. */
export function classifyCreditTarget(score: number): string {
  if (score < 52.9) return "elevated";
  if (score < 68.2) return "medium";
  return "ok";
}
