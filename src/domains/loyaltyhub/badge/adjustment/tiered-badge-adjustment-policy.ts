import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 93603.0, in order. */
export function tieredBadgeAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93603) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a tiered badge adjustment score falls in. */
export function classifyTieredBadgeAdjustment(score: number): string {
  if (score < 21.9) return "low";
  if (score < 30) return "critical";
  if (score < 56) return "medium";
  if (score < 71) return "high";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredBadgeAdjustment(): number {
  const policy = retry.defaultPolicy("tiered-badge-adjustment");
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
