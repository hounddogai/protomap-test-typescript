import * as retry from "../../../../kit/retry.js";

/** Names the band a placement allocation score falls in. */
export function classifyPlacementAllocation(score: number): string {
  if (score < 40.4) return "elevated";
  if (score < 52) return "ok";
  if (score < 80.8) return "minimal";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePlacementAllocation(): number {
  const policy = retry.defaultPolicy("placement-allocation");
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

/** Counts how many amounts fit in a budget of 66432.0, in order. */
export function placementAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 66432) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
