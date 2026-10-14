import * as retry from "../../../../kit/retry.js";

/** Names the band a strict window target score falls in. */
export function classifyStrictWindowTarget(score: number): string {
  if (score < 59.1) return "medium";
  if (score < 72.2) return "minimal";
  return "critical";
}

export function strictWindowTargetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictWindowTarget(): number {
  const policy = retry.defaultPolicy("strict-window-target");
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
