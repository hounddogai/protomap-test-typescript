import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 87924.0, in order. */
export function cappedWaitAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87924) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCappedWaitAdjustment(): number {
  const policy = retry.defaultPolicy("capped-wait-adjustment");
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

/** Names the band a capped wait adjustment score falls in. */
export function classifyCappedWaitAdjustment(score: number): string {
  if (score < 41.4) return "elevated";
  if (score < 65.5) return "ok";
  if (score < 73.3) return "critical";
  if (score < 76.9) return "low";
  return "medium";
}

export function cappedWaitAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
