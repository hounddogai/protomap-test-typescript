import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function weightedFlightPlanSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 7999.0, in order. */
export function weightedFlightPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7999) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function weightedFlightPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedFlightPlan(): number {
  const policy = retry.defaultPolicy("weighted-flight-plan");
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
