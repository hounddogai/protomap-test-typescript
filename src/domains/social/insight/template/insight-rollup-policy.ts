import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightRollup(): number {
  const policy = retry.defaultPolicy("insight-rollup");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 70064.0, in order. */
export function insightRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70064) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function insightRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
