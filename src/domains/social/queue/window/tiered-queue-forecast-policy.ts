import * as numbers from "../../../../kit/numbers.js";

/** Puts a tiered queue forecast code in its canonical TQF- form. */
export function normalizeTieredQueueForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TQF-")) return clean;
  return `TQF-${clean.replaceAll(" ", "-")}`;
}

export function tieredQueueForecastBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 90066.0, in order. */
export function tieredQueueForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 90066) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
