import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending sla baseline code in its canonical PSB- form. */
export function normalizePendingSlaBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PSB-")) return clean;
  return `PSB-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 88592.0, in order. */
export function pendingSlaBaselineBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 88592) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingSlaBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.97;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
