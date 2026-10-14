import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function modelAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeModelAllocation(): number {
  const policy = retry.defaultPolicy("model-allocation");
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

/** Names the band a model allocation score falls in. */
export function classifyModelAllocation(score: number): string {
  if (score < 83.8) return "high";
  if (score < 91.3) return "watch";
  return "low";
}

/** Counts how many amounts fit in a budget of 81858.0, in order. */
export function modelAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81858) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
