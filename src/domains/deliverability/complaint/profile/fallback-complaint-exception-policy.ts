import * as retry from "../../../../kit/retry.js";

/** Names the band a fallback complaint exception score falls in. */
export function classifyFallbackComplaintException(score: number): string {
  if (score < 53.1) return "ok";
  if (score < 67.6) return "critical";
  if (score < 80.1) return "minimal";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeFallbackComplaintException(): number {
  const policy = retry.defaultPolicy("fallback-complaint-exception");
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
