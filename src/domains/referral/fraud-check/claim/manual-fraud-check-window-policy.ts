import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual fraud check window code in its canonical MFCW- form. */
export function normalizeManualFraudCheckWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFCW-")) return clean;
  return `MFCW-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 14795.0, in order. */
export function manualFraudCheckWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 14795) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualFraudCheckWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function manualFraudCheckWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.37;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
