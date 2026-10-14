import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered pacing target code in its canonical TPT- form. */
export function normalizeTieredPacingTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPT-")) return clean;
  return `TPT-${clean.replaceAll(" ", "-")}`;
}

export function tieredPacingTargetBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function tieredPacingTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 40697.0, in order. */
export function tieredPacingTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40697) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
