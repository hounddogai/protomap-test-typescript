import * as numbers from "../../../../kit/numbers.js";

export function strictDeflectionVarianceBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a strict deflection variance code in its canonical SDV- form. */
export function normalizeStrictDeflectionVarianceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDV-")) return clean;
  return `SDV-${clean.replaceAll(" ", "-")}`;
}

export function strictDeflectionVarianceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
