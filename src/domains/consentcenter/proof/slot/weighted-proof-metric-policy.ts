import * as retry from "../../../../kit/retry.js";

/** Names the band a weighted proof metric score falls in. */
export function classifyWeightedProofMetric(score: number): string {
  if (score < 8.3) return "minimal";
  if (score < 29.3) return "ok";
  if (score < 66.8) return "critical";
  if (score < 73.4) return "high";
  return "elevated";
}

export function weightedProofMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWeightedProofMetric(): number {
  const policy = retry.defaultPolicy("weighted-proof-metric");
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
