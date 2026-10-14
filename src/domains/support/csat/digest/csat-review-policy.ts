import * as retry from "../../../../kit/retry.js";

/** Names the band a csat review score falls in. */
export function classifyCsatReview(score: number): string {
  if (score < 51) return "medium";
  if (score < 72.3) return "critical";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCsatReview(): number {
  const policy = retry.defaultPolicy("csat-review");
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
