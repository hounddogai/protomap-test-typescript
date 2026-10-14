import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a manual redemption assignment score falls in. */
export function classifyManualRedemptionAssignment(score: number): string {
  if (score < 6.1) return "high";
  if (score < 64.8) return "elevated";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeManualRedemptionAssignment(): number {
  const policy = retry.defaultPolicy("manual-redemption-assignment");
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

/** Counts how many amounts fit in a budget of 44684.0, in order. */
export function manualRedemptionAssignmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44684) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualRedemptionAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
