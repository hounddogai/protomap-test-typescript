import * as numbers from "../../../../kit/numbers.js";

/** Puts a csat batch code in its canonical CB- form. */
export function normalizeCsatBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CB-")) return clean;
  return `CB-${clean.replaceAll(" ", "-")}`;
}

export function csatBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.3;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 13775.0, in order. */
export function csatBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13775) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function csatBatchBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
