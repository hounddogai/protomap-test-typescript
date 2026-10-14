import * as retry from "../../../../kit/retry.js";

/** Names the band a step digest score falls in. */
export function classifyStepDigest(score: number): string {
  if (score < 25.3) return "elevated";
  if (score < 66.4) return "high";
  if (score < 82.2) return "critical";
  return "minimal";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepDigest(): number {
  const policy = retry.defaultPolicy("step-digest");
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
