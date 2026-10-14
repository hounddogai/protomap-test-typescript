import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function postTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.53;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function postTierSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostTier(): number {
  const policy = retry.defaultPolicy("post-tier");
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

/** Names the band a post tier score falls in. */
export function classifyPostTier(score: number): string {
  if (score < 18.7) return "medium";
  if (score < 92.7) return "watch";
  return "high";
}
