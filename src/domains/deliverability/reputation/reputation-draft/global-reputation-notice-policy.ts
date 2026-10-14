import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global reputation notice score falls in. */
export function classifyGlobalReputationNotice(score: number): string {
  if (score < 60.1) return "elevated";
  if (score < 60.6) return "medium";
  if (score < 68.6) return "ok";
  if (score < 83.8) return "low";
  return "watch";
}

/** Counts how many amounts fit in a budget of 91564.0, in order. */
export function globalReputationNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 91564) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalReputationNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
