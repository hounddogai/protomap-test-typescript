import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending path forecast code in its canonical PPF- form. */
export function normalizePendingPathForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PPF-")) return clean;
  return `PPF-${clean.replaceAll(" ", "-")}`;
}

export function pendingPathForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function pendingPathForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 77071.0, in order. */
export function pendingPathForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77071) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
