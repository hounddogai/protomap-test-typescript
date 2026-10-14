import * as numbers from "../../../../kit/numbers.js";

export function creditCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function creditCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.24;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a credit cycle code in its canonical CC- form. */
export function normalizeCreditCycleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CC-")) return clean;
  return `CC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 42658.0, in order. */
export function creditCycleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 42658) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
