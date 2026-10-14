import * as numbers from "../../../../kit/numbers.js";

export function adaptiveQueueTargetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive queue target code in its canonical AQT- form. */
export function normalizeAdaptiveQueueTargetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AQT-")) return clean;
  return `AQT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 59297.0, in order. */
export function adaptiveQueueTargetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59297) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
