import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function tieredChallengeSummaryBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredChallengeSummary(): number {
  const policy = retry.defaultPolicy("tiered-challenge-summary");
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

/** Counts how many amounts fit in a budget of 12485.0, in order. */
export function tieredChallengeSummaryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 12485) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered challenge summary score falls in. */
export function classifyTieredChallengeSummary(score: number): string {
  if (score < 83.7) return "ok";
  if (score < 98.9) return "elevated";
  return "high";
}
