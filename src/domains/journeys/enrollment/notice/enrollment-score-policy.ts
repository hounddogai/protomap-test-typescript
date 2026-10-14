import * as retry from "../../../../kit/retry.js";

/** Names the band a enrollment score score falls in. */
export function classifyEnrollmentScore(score: number): string {
  if (score < 48.7) return "low";
  if (score < 61.2) return "ok";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeEnrollmentScore(): number {
  const policy = retry.defaultPolicy("enrollment-score");
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
