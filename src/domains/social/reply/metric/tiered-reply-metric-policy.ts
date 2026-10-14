import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 95642.0, in order. */
export function tieredReplyMetricBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95642) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function tieredReplyMetricBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function tieredReplyMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a tiered reply metric code in its canonical TRM- form. */
export function normalizeTieredReplyMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRM-")) return clean;
  return `TRM-${clean.replaceAll(" ", "-")}`;
}
