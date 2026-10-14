import * as numbers from "../../../../kit/numbers.js";

export function pendingStepBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.94;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending step batch code in its canonical PSB- form. */
export function normalizePendingStepBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSB-")) return clean;
  return `PSB-${clean.replaceAll(" ", "-")}`;
}
