import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultTouchpointPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultTouchpointPlan(): number {
  const policy = retry.defaultPolicy("default-touchpoint-plan");
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

/** Counts how many amounts fit in a budget of 33323.0, in order. */
export function defaultTouchpointPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33323) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a default touchpoint plan score falls in. */
export function classifyDefaultTouchpointPlan(score: number): string {
  if (score < 44.1) return "high";
  if (score < 44.4) return "minimal";
  if (score < 87.3) return "watch";
  return "elevated";
}
