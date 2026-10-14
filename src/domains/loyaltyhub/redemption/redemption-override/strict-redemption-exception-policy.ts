import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a strict redemption exception score falls in. */
export function classifyStrictRedemptionException(score: number): string {
  if (score < 17.6) return "watch";
  if (score < 26.4) return "low";
  return "high";
}

export function strictRedemptionExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictRedemptionException(): number {
  const policy = retry.defaultPolicy("strict-redemption-exception");
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
