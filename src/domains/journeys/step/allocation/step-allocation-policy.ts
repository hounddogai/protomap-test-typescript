import * as retry from "../../../../kit/retry.js";

/** Names the band a step allocation score falls in. */
export function classifyStepAllocation(score: number): string {
  if (score < 36) return "minimal";
  if (score < 44.5) return "watch";
  if (score < 51.6) return "medium";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepAllocation(): number {
  const policy = retry.defaultPolicy("step-allocation");
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

/** Counts how many amounts fit in a budget of 49182.0, in order. */
export function stepAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49182) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
