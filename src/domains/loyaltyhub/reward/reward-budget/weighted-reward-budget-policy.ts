import * as retry from "../../../../kit/retry.js";

export function weightedRewardBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 74708.0, in order. */
export function weightedRewardBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74708) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a weighted reward budget code in its canonical WRB- form. */
export function normalizeWeightedRewardBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WRB-")) return clean;
  return `WRB-${clean.replaceAll(" ", "-")}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedRewardBudget(): number {
  const policy = retry.defaultPolicy("weighted-reward-budget");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 4);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
