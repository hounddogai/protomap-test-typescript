import * as numbers from "../../../../kit/numbers.js";

export function scheduledPreferenceAllocationWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.28;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 27575.0, in order. */
export function scheduledPreferenceAllocationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 27575) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a scheduled preference allocation code in its canonical SPA- form. */
export function normalizeScheduledPreferenceAllocationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SPA-")) return clean;
  return `SPA-${clean.replaceAll(" ", "-")}`;
}
