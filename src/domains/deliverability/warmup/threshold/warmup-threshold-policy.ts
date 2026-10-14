import * as retry from "../../../../kit/retry.js";

export function warmupThresholdSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeWarmupThreshold(): number {
  const policy = retry.defaultPolicy("warmup-threshold");
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

/** Names the band a warmup threshold score falls in. */
export function classifyWarmupThreshold(score: number): string {
  if (score < 38.4) return "minimal";
  if (score < 85) return "low";
  if (score < 87.5) return "high";
  return "watch";
}
