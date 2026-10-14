import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 3862.0, in order. */
export function lenientRewardBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 3862) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientRewardBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient reward baseline score falls in. */
export function classifyLenientRewardBaseline(score: number): string {
  if (score < 29.9) return "ok";
  if (score < 41.6) return "medium";
  if (score < 89.3) return "watch";
  if (score < 96.6) return "minimal";
  return "elevated";
}

export function lenientRewardBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
