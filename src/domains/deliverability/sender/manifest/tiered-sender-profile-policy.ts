import * as numbers from "../../../../kit/numbers.js";

export function tieredSenderProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a tiered sender profile code in its canonical TSP- form. */
export function normalizeTieredSenderProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TSP-")) return clean;
  return `TSP-${clean.replaceAll(" ", "-")}`;
}

export function tieredSenderProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
