import * as retry from "../../../../kit/retry.js";

/** Puts a rolling opt out review code in its canonical ROOR- form. */
export function normalizeRollingOptOutReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ROOR-")) return clean;
  return `ROOR-${clean.replaceAll(" ", "-")}`;
}

export function rollingOptOutReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRollingOptOutReview(): number {
  const policy = retry.defaultPolicy("rolling-opt-out-review");
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

/** Names the band a rolling opt out review score falls in. */
export function classifyRollingOptOutReview(score: number): string {
  if (score < 3.2) return "ok";
  if (score < 63.1) return "low";
  if (score < 73.5) return "minimal";
  if (score < 90.4) return "watch";
  return "elevated";
}
