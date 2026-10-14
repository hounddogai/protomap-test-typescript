import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a bid rule target score falls in. */
export function classifyBidRuleTarget(score: number): string {
  if (score < 36.6) return "elevated";
  if (score < 71.8) return "high";
  if (score < 86.6) return "low";
  return "medium";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeBidRuleTarget(): number {
  const policy = retry.defaultPolicy("bid-rule-target");
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

export function bidRuleTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
