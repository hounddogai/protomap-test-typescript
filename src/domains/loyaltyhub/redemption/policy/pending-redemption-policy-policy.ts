import * as numbers from "../../../../kit/numbers.js";

export function pendingRedemptionPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 83494.0, in order. */
export function pendingRedemptionPolicyBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 83494) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingRedemptionPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.81;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a pending redemption policy code in its canonical PRP- form. */
export function normalizePendingRedemptionPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PRP-")) return clean;
  return `PRP-${clean.replaceAll(" ", "-")}`;
}
