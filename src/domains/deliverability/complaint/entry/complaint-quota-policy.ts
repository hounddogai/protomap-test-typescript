import * as numbers from "../../../../kit/numbers.js";

/** Puts a complaint quota code in its canonical CQ- form. */
export function normalizeComplaintQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CQ-")) return clean;
  return `CQ-${clean.replaceAll(" ", "-")}`;
}

export function complaintQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.57;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function complaintQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
