import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStepMetric(): number {
  const policy = retry.defaultPolicy("step-metric");
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

export function stepMetricSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a step metric score falls in. */
export function classifyStepMetric(score: number): string {
  if (score < 21.3) return "minimal";
  if (score < 74.4) return "watch";
  return "ok";
}
