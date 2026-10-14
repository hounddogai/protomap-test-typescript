import * as numbers from "../../../../kit/numbers.js";

export function seasonalInsightAssignmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}

export function seasonalInsightAssignmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal insight assignment code in its canonical SIA- form. */
export function normalizeSeasonalInsightAssignmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SIA-")) return clean;
  return `SIA-${clean.replaceAll(" ", "-")}`;
}
