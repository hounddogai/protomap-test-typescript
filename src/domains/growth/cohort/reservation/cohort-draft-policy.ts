import * as retry from "../../../../kit/retry.js";

/** Names the band a cohort draft score falls in. */
export function classifyCohortDraft(score: number): string {
  if (score < 18.1) return "critical";
  if (score < 32.4) return "high";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortDraft(): number {
  const policy = retry.defaultPolicy("cohort-draft");
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

export function cohortDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
