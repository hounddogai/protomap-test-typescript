import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered sender target code in its canonical TST- form. */
export function normalizeTieredSenderTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TST-")) return clean;
  return `TST-${clean.replaceAll(" ", "-")}`;
}

export function tieredSenderTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tieredSenderTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
