import * as numbers from "../../../../kit/numbers.js";
import * as retry from "../../../../kit/retry.js";

export function postProfileBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePostProfile(): number {
  const policy = retry.defaultPolicy("post-profile");
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

/** Names the band a post profile score falls in. */
export function classifyPostProfile(score: number): string {
  if (score < 24.9) return "watch";
  if (score < 55.6) return "elevated";
  if (score < 91) return "high";
  if (score < 93.3) return "medium";
  return "minimal";
}
