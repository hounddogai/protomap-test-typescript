import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 89068.0, in order. */
export function scheduledTouchpointQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89068) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledTouchpointQuota(): number {
  const policy = retry.defaultPolicy("scheduled-touchpoint-quota");
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
