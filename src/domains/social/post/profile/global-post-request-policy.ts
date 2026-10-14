import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeGlobalPostRequest(): number {
  const policy = retry.defaultPolicy("global-post-request");
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

/** Names the band a global post request score falls in. */
export function classifyGlobalPostRequest(score: number): string {
  if (score < 32.9) return "elevated";
  if (score < 54) return "minimal";
  if (score < 94.6) return "critical";
  return "high";
}
