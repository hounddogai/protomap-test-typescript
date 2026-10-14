import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a global placement adjustment score falls in. */
export function classifyGlobalPlacementAdjustment(score: number): string {
  if (score < 41.9) return "high";
  if (score < 97.5) return "watch";
  return "medium";
}

/** Counts how many amounts fit in a budget of 99709.0, in order. */
export function globalPlacementAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 99709) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalPlacementAdjustmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalPlacementAdjustment(): number {
  const policy = retry.defaultPolicy("global-placement-adjustment");
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
