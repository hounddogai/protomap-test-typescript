import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightTarget(): number {
  const policy = retry.defaultPolicy("insight-target");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 3);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}

/** Names the band a insight target score falls in. */
export function classifyInsightTarget(score: number): string {
  if (score < 30.1) return "medium";
  if (score < 80.7) return "minimal";
  if (score < 98.2) return "high";
  return "critical";
}
