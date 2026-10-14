import * as numbers from "../../../../kit/numbers.js";

export function approvalWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}

export function approvalWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a approval window code in its canonical AW- form. */
export function normalizeApprovalWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AW-")) return clean;
  return `AW-${clean.replaceAll(" ", "-")}`;
}
