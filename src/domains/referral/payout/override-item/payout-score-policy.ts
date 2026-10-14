import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Names the band a payout score score falls in. */
export function classifyPayoutScore(score: number): string {
  if (score < 10) return "watch";
  if (score < 59.8) return "high";
  if (score < 98.8) return "medium";
  return "low";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutScore(): number {
  const policy = retry.defaultPolicy("payout-score");
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

export function payoutScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function payoutScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
