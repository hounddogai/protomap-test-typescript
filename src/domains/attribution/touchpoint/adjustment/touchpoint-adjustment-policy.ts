import * as retry from "../../../../kit/retry.js";

/** Names the band a touchpoint adjustment score falls in. */
export function classifyTouchpointAdjustment(score: number): string {
  if (score < 39.8) return "ok";
  if (score < 87.9) return "critical";
  return "low";
}

export function touchpointAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeTouchpointAdjustment(): number {
  const policy = retry.defaultPolicy("touchpoint-adjustment");
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
