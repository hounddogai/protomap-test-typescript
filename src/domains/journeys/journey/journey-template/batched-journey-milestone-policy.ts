import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched journey milestone code in its canonical BJM- form. */
export function normalizeBatchedJourneyMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BJM-")) return clean;
  return `BJM-${clean.replaceAll(" ", "-")}`;
}

export function batchedJourneyMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.12;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 21876.0, in order. */
export function batchedJourneyMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 21876) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedJourneyMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
