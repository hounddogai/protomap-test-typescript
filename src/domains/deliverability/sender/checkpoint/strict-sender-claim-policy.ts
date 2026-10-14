import * as numbers from "../../../../kit/numbers.js";

export function strictSenderClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.86;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a strict sender claim score falls in. */
export function classifyStrictSenderClaim(score: number): string {
  if (score < 4.9) return "ok";
  if (score < 6.9) return "critical";
  if (score < 10.6) return "minimal";
  return "medium";
}

export function strictSenderClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 43513.0, in order. */
export function strictSenderClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43513) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
