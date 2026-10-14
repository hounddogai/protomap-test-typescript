import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched post override code in its canonical BPO- form. */
export function normalizeBatchedPostOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BPO-")) return clean;
  return `BPO-${clean.replaceAll(" ", "-")}`;
}

export function batchedPostOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function batchedPostOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
