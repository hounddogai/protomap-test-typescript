import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 77552.0, in order. */
export function retentionBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77552) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function retentionBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionBudget(): number {
  const policy = retry.defaultPolicy("retention-budget");
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

/** Names the band a retention budget score falls in. */
export function classifyRetentionBudget(score: number): string {
  if (score < 10.7) return "high";
  if (score < 51.7) return "minimal";
  return "elevated";
}
