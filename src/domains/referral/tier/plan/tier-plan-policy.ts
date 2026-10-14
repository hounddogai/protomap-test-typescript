import * as numbers from "../../../../kit/numbers.js";

export function tierPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function tierPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a tier plan code in its canonical TP- form. */
export function normalizeTierPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TP-")) return clean;
  return `TP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 8768.0, in order. */
export function tierPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8768) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
