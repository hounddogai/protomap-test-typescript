import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedCreditSchedule(): number {
  const policy = retry.defaultPolicy("weighted-credit-schedule");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function weightedCreditScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
