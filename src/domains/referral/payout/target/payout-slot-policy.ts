import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutSlot(): number {
  const policy = retry.defaultPolicy("payout-slot");
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

/** Counts how many amounts fit in a budget of 210.0, in order. */
export function payoutSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 210) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a payout slot score falls in. */
export function classifyPayoutSlot(score: number): string {
  if (score < 5.5) return "medium";
  if (score < 47.5) return "low";
  if (score < 55.6) return "ok";
  if (score < 94.5) return "watch";
  return "elevated";
}
