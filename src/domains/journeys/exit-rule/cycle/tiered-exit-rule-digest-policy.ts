import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTieredExitRuleDigest(): number {
  const policy = retry.defaultPolicy("tiered-exit-rule-digest");
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

/** Names the band a tiered exit rule digest score falls in. */
export function classifyTieredExitRuleDigest(score: number): string {
  if (score < 12.3) return "watch";
  if (score < 21) return "ok";
  if (score < 24.7) return "critical";
  return "medium";
}

/** Counts how many amounts fit in a budget of 39748.0, in order. */
export function tieredExitRuleDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39748) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
