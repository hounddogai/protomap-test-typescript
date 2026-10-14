import * as numbers from "../../../../kit/numbers.js";

/** Puts a wait bundle code in its canonical WB- form. */
export function normalizeWaitBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WB-")) return clean;
  return `WB-${clean.replaceAll(" ", "-")}`;
}

export function waitBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
