import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function primarySuppressionProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimarySuppressionProposal(): number {
  const policy = retry.defaultPolicy("primary-suppression-proposal");
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

/** Names the band a primary suppression proposal score falls in. */
export function classifyPrimarySuppressionProposal(score: number): string {
  if (score < 3.2) return "ok";
  if (score < 6.4) return "low";
  return "critical";
}

export function primarySuppressionProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
