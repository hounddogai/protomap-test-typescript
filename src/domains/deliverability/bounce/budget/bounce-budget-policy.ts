import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 18704.0, in order. */
export function bounceBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18704) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bounceBudgetBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBounceBudget(): number {
  const policy = retry.defaultPolicy("bounce-budget");
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

/** Names the band a bounce budget score falls in. */
export function classifyBounceBudget(score: number): string {
  if (score < 15.5) return "elevated";
  if (score < 99.7) return "critical";
  return "minimal";
}
