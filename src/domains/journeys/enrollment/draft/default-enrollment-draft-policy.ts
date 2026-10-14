import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function defaultEnrollmentDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 61069.0, in order. */
export function defaultEnrollmentDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61069) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeDefaultEnrollmentDraft(): number {
  const policy = retry.defaultPolicy("default-enrollment-draft");
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

/** Names the band a default enrollment draft score falls in. */
export function classifyDefaultEnrollmentDraft(score: number): string {
  if (score < 32.3) return "watch";
  if (score < 51.1) return "elevated";
  if (score < 66.2) return "high";
  if (score < 90.4) return "minimal";
  return "medium";
}
