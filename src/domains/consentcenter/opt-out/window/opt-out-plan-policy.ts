import * as numbers from "../../../../kit/numbers.js";

export function optOutPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 82752.0, in order. */
export function optOutPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 82752) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a opt out plan code in its canonical OOP- form. */
export function normalizeOptOutPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOP-")) return clean;
  return `OOP-${clean.replaceAll(" ", "-")}`;
}
