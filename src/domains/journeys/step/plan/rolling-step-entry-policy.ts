import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 86963.0, in order. */
export function rollingStepEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 86963) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingStepEntry(): number {
  const policy = retry.defaultPolicy("rolling-step-entry");
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
