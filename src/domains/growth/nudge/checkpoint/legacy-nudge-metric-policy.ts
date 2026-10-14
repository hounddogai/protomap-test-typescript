import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeLegacyNudgeMetric(): number {
  const policy = retry.defaultPolicy("legacy-nudge-metric");
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

/** Names the band a legacy nudge metric score falls in. */
export function classifyLegacyNudgeMetric(score: number): string {
  if (score < 27.5) return "medium";
  if (score < 57.5) return "watch";
  if (score < 61.2) return "critical";
  return "elevated";
}
