import * as retry from "../../../../kit/retry.js";

/** Names the band a pending frequency target score falls in. */
export function classifyPendingFrequencyTarget(score: number): string {
  if (score < 16.3) return "medium";
  if (score < 71.2) return "watch";
  if (score < 89.6) return "ok";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePendingFrequencyTarget(): number {
  const policy = retry.defaultPolicy("pending-frequency-target");
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
