import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36180.0, in order. */
export function senderRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36180) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function senderRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a sender rule score falls in. */
export function classifySenderRule(score: number): string {
  if (score < 66.8) return "ok";
  if (score < 70.5) return "minimal";
  if (score < 78.2) return "watch";
  return "critical";
}
