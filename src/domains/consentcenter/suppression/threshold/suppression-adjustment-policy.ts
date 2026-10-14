import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function suppressionAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Counts how many amounts fit in a budget of 38764.0, in order. */
export function suppressionAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 38764) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a suppression adjustment score falls in. */
export function classifySuppressionAdjustment(score: number): string {
  if (score < 43.9) return "ok";
  if (score < 78.7) return "elevated";
  if (score < 81.5) return "low";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeSuppressionAdjustment(): number {
  const policy = retry.defaultPolicy("suppression-adjustment");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
