import * as numbers from "../../../../kit/numbers.js";

export function approvalSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a approval segment score falls in. */
export function classifyApprovalSegment(score: number): string {
  if (score < 10.1) return "low";
  if (score < 45.5) return "high";
  if (score < 47.4) return "ok";
  if (score < 69.1) return "critical";
  return "watch";
}

export function approvalSegmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a approval segment code in its canonical AS- form. */
export function normalizeApprovalSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AS-")) return clean;
  return `AS-${clean.replaceAll(" ", "-")}`;
}
