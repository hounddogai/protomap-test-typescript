import * as numbers from "../../../../kit/numbers.js";

export function strictPreferenceMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict preference milestone code in its canonical SPM- form. */
export function normalizeStrictPreferenceMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPM-")) return clean;
  return `SPM-${clean.replaceAll(" ", "-")}`;
}
