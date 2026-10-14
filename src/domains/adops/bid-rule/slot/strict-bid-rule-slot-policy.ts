import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Counts how many amounts fit in a budget of 96959.0, in order. */
export function strictBidRuleSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96959) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a strict bid rule slot score falls in. */
export function classifyStrictBidRuleSlot(score: number): string {
  if (score < 26.5) return "critical";
  if (score < 29) return "watch";
  if (score < 63.9) return "high";
  if (score < 65.6) return "minimal";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictBidRuleSlot(): number {
  const policy = retry.defaultPolicy("strict-bid-rule-slot");
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

export function strictBidRuleSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
