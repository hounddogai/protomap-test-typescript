import * as numbers from "../../../../kit/numbers.js";

export function cappedQueueWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 98486.0, in order. */
export function cappedQueueWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98486) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedQueueWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a capped queue window code in its canonical CQW- form. */
export function normalizeCappedQueueWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CQW-")) return clean;
  return `CQW-${clean.replaceAll(" ", "-")}`;
}
