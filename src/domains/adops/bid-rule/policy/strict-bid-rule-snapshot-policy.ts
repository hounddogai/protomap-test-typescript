import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a strict bid rule snapshot score falls in. */
export function classifyStrictBidRuleSnapshot(score: number): string {
  if (score < 7.4) return "watch";
  if (score < 11.6) return "high";
  return "ok";
}

export function strictBidRuleSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictBidRuleSnapshot(): number {
  const policy = retry.defaultPolicy("strict-bid-rule-snapshot");
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
