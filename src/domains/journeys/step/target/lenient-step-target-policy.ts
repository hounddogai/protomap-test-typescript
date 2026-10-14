import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 43531.0, in order. */
export function lenientStepTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 43531) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function lenientStepTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function lenientStepTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.65;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientStepTarget(): number {
  const policy = retry.defaultPolicy("lenient-step-target");
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
