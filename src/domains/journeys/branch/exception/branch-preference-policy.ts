import * as numbers from "../../../../kit/numbers.js";

export function branchPreferenceSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 83207.0, in order. */
export function branchPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83207) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function branchPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a branch preference score falls in. */
export function classifyBranchPreference(score: number): string {
  if (score < 2.7) return "low";
  if (score < 14) return "medium";
  if (score < 94.5) return "critical";
  if (score < 99.4) return "ok";
  return "minimal";
}
