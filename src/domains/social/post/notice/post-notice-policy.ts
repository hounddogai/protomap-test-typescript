import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function postNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostNotice(): number {
  const policy = retry.defaultPolicy("post-notice");
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

/** Names the band a post notice score falls in. */
export function classifyPostNotice(score: number): string {
  if (score < 29.1) return "high";
  if (score < 75.1) return "low";
  return "watch";
}
