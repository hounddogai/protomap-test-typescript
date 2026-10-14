import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function paywallBaselineBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePaywallBaseline(): number {
  const policy = retry.defaultPolicy("paywall-baseline");
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

/** Names the band a paywall baseline score falls in. */
export function classifyPaywallBaseline(score: number): string {
  if (score < 2.8) return "low";
  if (score < 31.9) return "medium";
  return "watch";
}
