import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function primaryBadgeMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryBadgeMilestone(): number {
  const policy = retry.defaultPolicy("primary-badge-milestone");
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

export function primaryBadgeMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Names the band a primary badge milestone score falls in. */
export function classifyPrimaryBadgeMilestone(score: number): string {
  if (score < 32.2) return "medium";
  if (score < 32.4) return "watch";
  if (score < 66.4) return "minimal";
  return "low";
}
