import * as numbers from "../../../../kit/numbers.js";

/** Puts a seasonal exit rule manifest code in its canonical SERM- form. */
export function normalizeSeasonalExitRuleManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SERM-")) return clean;
  return `SERM-${clean.replaceAll(" ", "-")}`;
}

export function seasonalExitRuleManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.63;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
