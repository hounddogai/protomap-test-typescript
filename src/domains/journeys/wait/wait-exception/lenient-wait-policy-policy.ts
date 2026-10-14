import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLenientWaitPolicy(): number {
  const policy = retry.defaultPolicy("lenient-wait-policy");
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

export function lenientWaitPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.17;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient wait policy score falls in. */
export function classifyLenientWaitPolicy(score: number): string {
  if (score < 18.2) return "critical";
  if (score < 40.5) return "high";
  if (score < 55.7) return "ok";
  if (score < 57.4) return "medium";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 30466.0, in order. */
export function lenientWaitPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 30466) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
