import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalSubscriptionEstimate(): number {
  const policy = retry.defaultPolicy("global-subscription-estimate");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

export function globalSubscriptionEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a global subscription estimate score falls in. */
export function classifyGlobalSubscriptionEstimate(score: number): string {
  if (score < 32.8) return "watch";
  if (score < 49.8) return "minimal";
  if (score < 60.3) return "medium";
  return "critical";
}
