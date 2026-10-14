import * as numbers from "../../../../kit/numbers.js";

/** Puts a branch audit code in its canonical BA- form. */
export function normalizeBranchAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BA-")) return clean;
  return `BA-${clean.replaceAll(" ", "-")}`;
}

export function branchAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function branchAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
