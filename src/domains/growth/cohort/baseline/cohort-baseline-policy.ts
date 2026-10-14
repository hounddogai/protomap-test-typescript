import * as retry from "../../../../kit/retry.js";

export function cohortBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeCohortBaseline(): number {
  const policy = retry.defaultPolicy("cohort-baseline");
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

/** Names the band a cohort baseline score falls in. */
export function classifyCohortBaseline(score: number): string {
  if (score < 17.9) return "elevated";
  if (score < 58.2) return "low";
  if (score < 60.3) return "watch";
  if (score < 67.9) return "minimal";
  return "ok";
}
