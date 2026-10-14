import * as numbers from "../../../../kit/numbers.js";

export function globalRedemptionSegmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalRedemptionSegmentBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a global redemption segment code in its canonical GRS- form. */
export function normalizeGlobalRedemptionSegmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRS-")) return clean;
  return `GRS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 52307.0, in order. */
export function globalRedemptionSegmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52307) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
