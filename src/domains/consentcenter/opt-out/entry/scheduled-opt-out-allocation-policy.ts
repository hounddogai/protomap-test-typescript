import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled opt out allocation code in its canonical SOOA- form. */
export function normalizeScheduledOptOutAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SOOA-")) return clean;
  return `SOOA-${clean.replaceAll(" ", "-")}`;
}

export function scheduledOptOutAllocationBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function scheduledOptOutAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.04;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 97045.0, in order. */
export function scheduledOptOutAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97045) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
