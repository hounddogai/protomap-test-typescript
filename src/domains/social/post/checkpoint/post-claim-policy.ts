import * as numbers from "../../../../kit/numbers.js";

export function postClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a post claim score falls in. */
export function classifyPostClaim(score: number): string {
  if (score < 26.5) return "medium";
  if (score < 57.6) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 29533.0, in order. */
export function postClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29533) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
