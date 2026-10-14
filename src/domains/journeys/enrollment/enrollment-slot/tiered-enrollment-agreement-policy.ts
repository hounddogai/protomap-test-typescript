import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 68757.0, in order. */
export function tieredEnrollmentAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68757) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered enrollment agreement score falls in. */
export function classifyTieredEnrollmentAgreement(score: number): string {
  if (score < 30.9) return "minimal";
  if (score < 31.4) return "low";
  if (score < 58.9) return "high";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredEnrollmentAgreement(): number {
  const policy = retry.defaultPolicy("tiered-enrollment-agreement");
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

export function tieredEnrollmentAgreementWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
