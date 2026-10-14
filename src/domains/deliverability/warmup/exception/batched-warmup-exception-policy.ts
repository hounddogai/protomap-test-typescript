import * as numbers from "../../../../kit/numbers.js";

export function batchedWarmupExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a batched warmup exception code in its canonical BWE- form. */
export function normalizeBatchedWarmupExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BWE-")) return clean;
  return `BWE-${clean.replaceAll(" ", "-")}`;
}
