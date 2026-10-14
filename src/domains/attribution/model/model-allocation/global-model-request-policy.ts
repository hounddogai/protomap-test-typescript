import * as numbers from "../../../../kit/numbers.js";

export function globalModelRequestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

export function globalModelRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalModelRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a global model request code in its canonical GMR- form. */
export function normalizeGlobalModelRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GMR-")) return clean;
  return `GMR-${clean.replaceAll(" ", "-")}`;
}
