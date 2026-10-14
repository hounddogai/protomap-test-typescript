import * as numbers from "../../../../kit/numbers.js";

/** Puts a adaptive cohort score code in its canonical ACS- form. */
export function normalizeAdaptiveCohortScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACS-")) return clean;
  return `ACS-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveCohortScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.33;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
