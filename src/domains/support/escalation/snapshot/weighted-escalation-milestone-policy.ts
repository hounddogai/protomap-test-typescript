import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 22362.0, in order. */
export function weightedEscalationMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 22362) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedEscalationMilestone(): number {
  const policy = retry.defaultPolicy("weighted-escalation-milestone");
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
