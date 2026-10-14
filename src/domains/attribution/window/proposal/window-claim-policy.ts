import * as numbers from "../../../../kit/numbers.js";

export function windowClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a window claim code in its canonical WC- form. */
export function normalizeWindowClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WC-")) return clean;
  return `WC-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 40519.0, in order. */
export function windowClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 40519) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function windowClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
