import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedRedemptionProposal(): number {
  const policy = retry.defaultPolicy("weighted-redemption-proposal");
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

export function weightedRedemptionProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a weighted redemption proposal score falls in. */
export function classifyWeightedRedemptionProposal(score: number): string {
  if (score < 6.9) return "watch";
  if (score < 9.5) return "high";
  if (score < 12.6) return "critical";
  if (score < 15) return "minimal";
  return "elevated";
}

export function weightedRedemptionProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
