import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function lenientBranchTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientBranchTarget(): number {
  const policy = retry.defaultPolicy("lenient-branch-target");
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

/** Counts how many amounts fit in a budget of 96464.0, in order. */
export function lenientBranchTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96464) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a lenient branch target score falls in. */
export function classifyLenientBranchTarget(score: number): string {
  if (score < 49.9) return "high";
  if (score < 83.1) return "ok";
  if (score < 98.6) return "critical";
  return "minimal";
}
