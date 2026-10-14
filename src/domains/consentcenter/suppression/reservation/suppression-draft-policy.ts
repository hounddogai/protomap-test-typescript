import * as numbers from "../../../../kit/numbers.js";

export function suppressionDraftWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.71;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a suppression draft code in its canonical SD- form. */
export function normalizeSuppressionDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SD-")) return clean;
  return `SD-${clean.replaceAll(" ", "-")}`;
}
