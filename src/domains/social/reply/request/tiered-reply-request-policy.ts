import * as numbers from "../../../../kit/numbers.js";

export function tieredReplyRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.4;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered reply request code in its canonical TRR- form. */
export function normalizeTieredReplyRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRR-")) return clean;
  return `TRR-${clean.replaceAll(" ", "-")}`;
}
