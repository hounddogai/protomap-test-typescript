import * as numbers from "../../../../kit/numbers.js";

export function strictCohortDraftSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

export function strictCohortDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict cohort draft code in its canonical SCD- form. */
export function normalizeStrictCohortDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCD-")) return clean;
  return `SCD-${clean.replaceAll(" ", "-")}`;
}
