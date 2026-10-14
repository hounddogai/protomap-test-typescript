import * as numbers from "../../../../kit/numbers.js";

/** Puts a approval score code in its canonical AS- form. */
export function normalizeApprovalScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AS-")) return clean;
  return `AS-${clean.replaceAll(" ", "-")}`;
}

export function approvalScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.52;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function approvalScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function approvalScoreBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
