import * as numbers from "../../../../kit/numbers.js";

export function rollingSenderPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 96106.0, in order. */
export function rollingSenderPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 96106) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function rollingSenderPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 0.78;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling sender plan code in its canonical RSP- form. */
export function normalizeRollingSenderPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSP-")) return clean;
  return `RSP-${clean.replaceAll(" ", "-")}`;
}
