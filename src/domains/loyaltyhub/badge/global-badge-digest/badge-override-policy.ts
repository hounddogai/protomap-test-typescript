import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 89960.0, in order. */
export function badgeOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 89960) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function badgeOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.36;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a badge override code in its canonical BO- form. */
export function normalizeBadgeOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BO-")) return clean;
  return `BO-${clean.replaceAll(" ", "-")}`;
}

export function badgeOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
