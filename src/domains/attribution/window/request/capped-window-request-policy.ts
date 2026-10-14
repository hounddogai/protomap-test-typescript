import * as numbers from "../../../../kit/numbers.js";

/** Puts a capped window request code in its canonical CWR- form. */
export function normalizeCappedWindowRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CWR-")) return clean;
  return `CWR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 10168.0, in order. */
export function cappedWindowRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 10168) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function cappedWindowRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.62;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function cappedWindowRequestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
