import * as numbers from "../../../../kit/numbers.js";

export function pathRecordWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.8;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 33382.0, in order. */
export function pathRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 33382) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pathRecordSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Puts a path record code in its canonical PR- form. */
export function normalizePathRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}
