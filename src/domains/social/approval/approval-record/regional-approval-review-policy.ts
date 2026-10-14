import * as retry from "../../../../kit/retry.js";

/** Runs the default retry policy against a probe that succeeds late. */
export function probeRegionalApprovalReview(): number {
  const policy = retry.defaultPolicy("regional-approval-review");
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

export function regionalApprovalReviewSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Puts a regional approval review code in its canonical RAR- form. */
export function normalizeRegionalApprovalReviewCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAR-")) return clean;
  return `RAR-${clean.replaceAll(" ", "-")}`;
}
