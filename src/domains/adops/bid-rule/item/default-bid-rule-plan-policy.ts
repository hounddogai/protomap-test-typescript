import * as numbers from "../../../../kit/numbers.js";

/** Puts a default bid rule plan code in its canonical DBRP- form. */
export function normalizeDefaultBidRulePlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DBRP-")) return clean;
  return `DBRP-${clean.replaceAll(" ", "-")}`;
}

export function defaultBidRulePlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

export function defaultBidRulePlanWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 69171.0, in order. */
export function defaultBidRulePlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69171) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
