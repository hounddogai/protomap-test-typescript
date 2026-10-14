import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 36992.0, in order. */
export function primaryModelPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 36992) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a primary model plan code in its canonical PMP- form. */
export function normalizePrimaryModelPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PMP-")) return clean;
  return `PMP-${clean.replaceAll(" ", "-")}`;
}

export function primaryModelPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
