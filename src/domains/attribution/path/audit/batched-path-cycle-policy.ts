import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched path cycle code in its canonical BPC- form. */
export function normalizeBatchedPathCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPC-")) return clean;
  return `BPC-${clean.replaceAll(" ", "-")}`;
}

export function batchedPathCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function batchedPathCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.02;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function batchedPathCycleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
