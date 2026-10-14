import * as retry from "../../../../kit/retry.js";

/** Names the band a primary proof summary score falls in. */
export function classifyPrimaryProofSummary(score: number): string {
  if (score < 33.1) return "minimal";
  if (score < 95.6) return "medium";
  if (score < 96.6) return "high";
  return "low";
}

export function primaryProofSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probePrimaryProofSummary(): number {
  const policy = retry.defaultPolicy("primary-proof-summary");
  let calls = 0;
  let used: number;
  try {
    used = policy.run((attempt: number): boolean => attempt >= 2);
  } catch {
    return -1;
  }
  calls += used;
  return calls;
}
