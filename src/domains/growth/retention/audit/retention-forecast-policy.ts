import * as retry from "../../../../kit/retry.js";

export function retentionForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a retention forecast score falls in. */
export function classifyRetentionForecast(score: number): string {
  if (score < 40.6) return "critical";
  if (score < 69.2) return "elevated";
  if (score < 79.2) return "high";
  return "ok";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRetentionForecast(): number {
  const policy = retry.defaultPolicy("retention-forecast");
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
