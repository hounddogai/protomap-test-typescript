import * as retry from "../../../../kit/retry.js";

export function strictSuppressionExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeStrictSuppressionException(): number {
  const policy = retry.defaultPolicy("strict-suppression-exception");
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

/** Names the band a strict suppression exception score falls in. */
export function classifyStrictSuppressionException(score: number): string {
  if (score < 53.8) return "ok";
  if (score < 99.5) return "high";
  return "minimal";
}
