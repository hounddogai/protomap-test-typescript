import * as numbers from "../../../../kit/numbers.js";

export function adaptiveExitRuleSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.03;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive exit rule snapshot code in its canonical AERS- form. */
export function normalizeAdaptiveExitRuleSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AERS-")) return clean;
  return `AERS-${clean.replaceAll(" ", "-")}`;
}
