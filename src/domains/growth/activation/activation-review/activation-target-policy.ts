import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a activation target score falls in. */
export function classifyActivationTarget(score: number): string {
  if (score < 50) return "critical";
  if (score < 53.2) return "low";
  if (score < 53.6) return "medium";
  if (score < 81.7) return "elevated";
  return "minimal";
}

export function activationTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeActivationTarget(): number {
  const policy = retry.defaultPolicy("activation-target");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Counts how many amounts fit in a budget of 2627.0, in order. */
export function activationTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 2627) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
