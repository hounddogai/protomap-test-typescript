import * as retry from "../../../../kit/retry.js";

/** Names the band a weighted window request score falls in. */
export function classifyWeightedWindowRequest(score: number): string {
  if (score < 24.2) return "ok";
  if (score < 25.9) return "watch";
  if (score < 54.4) return "critical";
  if (score < 79.4) return "low";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedWindowRequest(): number {
  const policy = retry.defaultPolicy("weighted-window-request");
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
