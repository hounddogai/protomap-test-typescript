import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWaitPolicy(): number {
  const policy = retry.defaultPolicy("wait-policy");
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

/** Names the band a wait policy score falls in. */
export function classifyWaitPolicy(score: number): string {
  if (score < 64.5) return "elevated";
  if (score < 73) return "medium";
  if (score < 75.3) return "critical";
  if (score < 75.8) return "low";
  return "high";
}
