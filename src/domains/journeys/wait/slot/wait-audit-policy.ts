import * as numbers from "../../../../kit/numbers.js";

export function waitAuditSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

/** Puts a wait audit code in its canonical WA- form. */
export function normalizeWaitAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WA-")) return clean;
  return `WA-${clean.replaceAll(" ", "-")}`;
}

export function waitAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
