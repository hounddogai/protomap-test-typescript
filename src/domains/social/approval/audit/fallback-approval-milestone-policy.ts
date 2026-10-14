import * as numbers from "../../../../kit/numbers.js";

export function fallbackApprovalMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackApprovalMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 90625.0, in order. */
export function fallbackApprovalMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90625) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback approval milestone code in its canonical FAM- form. */
export function normalizeFallbackApprovalMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FAM-")) return clean;
  return `FAM-${clean.replaceAll(" ", "-")}`;
}
