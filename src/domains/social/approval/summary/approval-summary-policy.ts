import * as collections from "../../../../kit/collections.js";
import * as retry from "../../../../kit/retry.js";
import * as text from "../../../../kit/text.js";

/** Names the band a approval summary score falls in. */
export function classifyApprovalSummary(score: number): string {
  if (score < 37.9) return "medium";
  if (score < 57.1) return "high";
  if (score < 63.1) return "low";
  return "elevated";
}

/** Runs the default retry policy against a probe that succeeds late. */
export function probeApprovalSummary(): number {
  const policy = retry.defaultPolicy("approval-summary");
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

export function mergeApprovalSummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function approvalSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
