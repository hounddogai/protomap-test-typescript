import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 17194.0, in order. */
export function senderTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17194) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function senderTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a sender target score falls in. */
export function classifySenderTarget(score: number): string {
  if (score < 8.3) return "medium";
  if (score < 53.8) return "low";
  if (score < 79.6) return "minimal";
  return "elevated";
}

export function senderTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.31;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
