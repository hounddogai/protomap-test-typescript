import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional nudge baseline code in its canonical RNB- form. */
export function normalizeRegionalNudgeBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RNB-")) return clean;
  return `RNB-${clean.replaceAll(" ", "-")}`;
}

export function regionalNudgeBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
