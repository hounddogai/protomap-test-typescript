import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a batched bid rule notice score falls in. */
export function classifyBatchedBidRuleNotice(score: number): string {
  if (score < 71) return "medium";
  if (score < 80.1) return "watch";
  if (score < 90.4) return "minimal";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBatchedBidRuleNotice(): number {
  const policy = retry.defaultPolicy("batched-bid-rule-notice");
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

/** Counts how many amounts fit in a budget of 61271.0, in order. */
export function batchedBidRuleNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61271) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedBidRuleNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
