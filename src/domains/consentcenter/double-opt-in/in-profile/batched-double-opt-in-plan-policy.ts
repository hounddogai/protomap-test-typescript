import * as numbers from "../../../../kit/numbers.js";

/** Puts a batched double opt in plan code in its canonical BDOIP- form. */
export function normalizeBatchedDoubleOptInPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BDOIP-")) return clean;
  return `BDOIP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 18962.0, in order. */
export function batchedDoubleOptInPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18962) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function batchedDoubleOptInPlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.76;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
