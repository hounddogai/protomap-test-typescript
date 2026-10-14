import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeAdaptiveExitRuleProfile(): number {
  const policy = retry.defaultPolicy("adaptive-exit-rule-profile");
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

export function adaptiveExitRuleProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 38127.0, in order. */
export function adaptiveExitRuleProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38127) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptiveExitRuleProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}
