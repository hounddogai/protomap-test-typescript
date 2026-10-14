import * as numbers from "../../../../kit/numbers.js";

/** Puts a opt out cycle code in its canonical OOC- form. */
export function normalizeOptOutCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOC-")) return clean;
  return `OOC-${clean.replaceAll(" ", "-")}`;
}

export function optOutCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function optOutCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
