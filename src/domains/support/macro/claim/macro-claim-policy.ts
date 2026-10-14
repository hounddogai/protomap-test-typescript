import * as retry from "../../../../kit/retry.js";

export function macroClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

/** Names the band a macro claim score falls in. */
export function classifyMacroClaim(score: number): string {
  if (score < 5.2) return "critical";
  if (score < 11.9) return "ok";
  if (score < 55.1) return "minimal";
  return "high";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeMacroClaim(): number {
  const policy = retry.defaultPolicy("macro-claim");
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
