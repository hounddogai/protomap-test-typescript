import * as numbers from "../../../../kit/numbers.js";

/** Puts a bounce summary code in its canonical BS- form. */
export function normalizeBounceSummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BS-")) return clean;
  return `BS-${clean.replaceAll(" ", "-")}`;
}

export function bounceSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
