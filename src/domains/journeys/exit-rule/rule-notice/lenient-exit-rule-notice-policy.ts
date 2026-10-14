import * as numbers from "../../../../kit/numbers.js";

/** Names the band a lenient exit rule notice score falls in. */
export function classifyLenientExitRuleNotice(score: number): string {
  if (score < 3) return "minimal";
  if (score < 50.1) return "elevated";
  return "watch";
}

export function lenientExitRuleNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 72059.0, in order. */
export function lenientExitRuleNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 72059) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
