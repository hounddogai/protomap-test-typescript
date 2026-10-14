import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeScheduledPayoutScore(): number {
  const policy = retry.defaultPolicy("scheduled-payout-score");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 1);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a scheduled payout score score falls in. */
export function classifyScheduledPayoutScore(score: number): string {
  if (score < 63.4) return "watch";
  if (score < 77.6) return "critical";
  if (score < 87.8) return "high";
  return "minimal";
}
