import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probePayoutReview(): number {
  const policy = retry.defaultPolicy("payout-review");
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

/** Names the band a payout review score falls in. */
export function classifyPayoutReview(score: number): string {
  if (score < 29.1) return "high";
  if (score < 95.2) return "low";
  return "critical";
}

/** Puts a payout review code in its canonical PR- form. */
export function normalizePayoutReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

export function payoutReviewWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
