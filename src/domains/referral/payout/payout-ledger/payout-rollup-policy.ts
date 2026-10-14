import * as retry from "../../../../kit/retry.js";

/** Names the band a payout rollup score falls in. */
export function classifyPayoutRollup(score: number): string {
  if (score < 80) return "minimal";
  if (score < 93) return "critical";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutRollup(): number {
  const policy = retry.defaultPolicy("payout-rollup");
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

/** Counts how many amounts fit in a budget of 34738.0, in order. */
export function payoutRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 34738) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
