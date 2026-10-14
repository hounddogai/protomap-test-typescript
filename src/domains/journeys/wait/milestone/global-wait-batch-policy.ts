import * as numbers from "../../../../kit/numbers.js";

export function globalWaitBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalWaitBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a global wait batch code in its canonical GWB- form. */
export function normalizeGlobalWaitBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GWB-")) return clean;
  return `GWB-${clean.replaceAll(" ", "-")}`;
}
