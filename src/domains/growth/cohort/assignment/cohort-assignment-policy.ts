import * as retry from "../../../../kit/retry.js";

/** Names the band a cohort assignment score falls in. */
export function classifyCohortAssignment(score: number): string {
  if (score < 34.1) return "ok";
  if (score < 41.7) return "minimal";
  if (score < 64.8) return "high";
  if (score < 95.6) return "elevated";
  return "watch";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortAssignment(): number {
  const policy = retry.defaultPolicy("cohort-assignment");
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
