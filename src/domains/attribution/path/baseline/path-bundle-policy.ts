import * as numbers from "../../../../kit/numbers.js";

export function pathBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function pathBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a path bundle code in its canonical PB- form. */
export function normalizePathBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}
