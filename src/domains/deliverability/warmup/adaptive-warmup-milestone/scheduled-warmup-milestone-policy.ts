import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 98541.0, in order. */
export function scheduledWarmupMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98541) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function scheduledWarmupMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled warmup milestone code in its canonical SWM- form. */
export function normalizeScheduledWarmupMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWM-")) return clean;
  return `SWM-${clean.replaceAll(" ", "-")}`;
}
