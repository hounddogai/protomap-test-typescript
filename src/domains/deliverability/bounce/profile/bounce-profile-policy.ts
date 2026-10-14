import * as numbers from "../../../../kit/numbers.js";

/** Names the band a bounce profile score falls in. */
export function classifyBounceProfile(score: number): string {
  if (score < 17.2) return "elevated";
  if (score < 42.9) return "ok";
  if (score < 81.7) return "watch";
  return "medium";
}

export function bounceProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
