import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 62987.0, in order. */
export function csatWindowBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62987) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function csatWindowBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a csat window code in its canonical CW- form. */
export function normalizeCsatWindowCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CW-")) return clean;
  return `CW-${clean.replaceAll(" ", "-")}`;
}
