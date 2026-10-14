import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function scheduledWaitRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledWaitRequest(): number {
  const policy = retry.defaultPolicy("scheduled-wait-request");
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

/** Counts how many amounts fit in a budget of 52099.0, in order. */
export function scheduledWaitRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52099) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
