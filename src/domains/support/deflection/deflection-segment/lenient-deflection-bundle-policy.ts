import * as numbers from "../../../../kit/numbers.js";

export function lenientDeflectionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a lenient deflection bundle code in its canonical LDB- form. */
export function normalizeLenientDeflectionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LDB-")) return clean;
  return `LDB-${clean.replaceAll(" ", "-")}`;
}

export function lenientDeflectionBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.35;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
