import * as numbers from "../../../../kit/numbers.js";

export function cappedOptOutDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 58733.0, in order. */
export function cappedOptOutDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58733) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a capped opt out digest score falls in. */
export function classifyCappedOptOutDigest(score: number): string {
  if (score < 6.4) return "elevated";
  if (score < 8) return "ok";
  return "watch";
}
