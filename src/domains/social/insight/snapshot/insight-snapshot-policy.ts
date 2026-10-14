import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeInsightSnapshot(): number {
  const policy = retry.defaultPolicy("insight-snapshot");
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

/** Names the band a insight snapshot score falls in. */
export function classifyInsightSnapshot(score: number): string {
  if (score < 29.9) return "low";
  if (score < 89.3) return "watch";
  return "minimal";
}
