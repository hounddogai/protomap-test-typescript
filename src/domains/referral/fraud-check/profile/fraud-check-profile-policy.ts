import * as numbers from "../../../../kit/numbers.js";

/** Puts a fraud check profile code in its canonical FCP- form. */
export function normalizeFraudCheckProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCP-")) return clean;
  return `FCP-${clean.replaceAll(" ", "-")}`;
}

export function fraudCheckProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fraudCheckProfileSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
