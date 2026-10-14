import * as retry from "../../../../kit/retry.js";

/** Names the band a weighted deflection rule score falls in. */
export function classifyWeightedDeflectionRule(score: number): string {
  if (score < 58.4) return "minimal";
  if (score < 61.9) return "low";
  if (score < 92.1) return "high";
  return "critical";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedDeflectionRule(): number {
  const policy = retry.defaultPolicy("weighted-deflection-rule");
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
