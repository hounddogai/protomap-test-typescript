import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 87438.0, in order. */
export function tieredBranchCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87438) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredBranchCycle(): number {
  const policy = retry.defaultPolicy("tiered-branch-cycle");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 5);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a tiered branch cycle score falls in. */
export function classifyTieredBranchCycle(score: number): string {
  if (score < 57.9) return "critical";
  if (score < 90.3) return "low";
  return "elevated";
}
