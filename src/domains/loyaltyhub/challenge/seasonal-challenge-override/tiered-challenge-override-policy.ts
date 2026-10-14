import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a tiered challenge override score falls in. */
export function classifyTieredChallengeOverride(score: number): string {
  if (score < 13.3) return "low";
  if (score < 66.6) return "medium";
  if (score < 87.8) return "critical";
  if (score < 90.2) return "ok";
  return "high";
}

export function tieredChallengeOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.49;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredChallengeOverride(): number {
  const policy = retry.defaultPolicy("tiered-challenge-override");
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

/** Counts how many amounts fit in a budget of 88467.0, in order. */
export function tieredChallengeOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88467) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
