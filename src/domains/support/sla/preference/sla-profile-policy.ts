import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSlaProfile(): number {
  const policy = retry.defaultPolicy("sla-profile");
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

/** Names the band a sla profile score falls in. */
export function classifySlaProfile(score: number): string {
  if (score < 15.9) return "critical";
  if (score < 21.3) return "elevated";
  if (score < 48.1) return "high";
  if (score < 93.9) return "watch";
  return "ok";
}

export function slaProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 57158.0, in order. */
export function slaProfileBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 57158) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
