import * as numbers from "../../../../kit/numbers.js";

export function fallbackOptOutRuleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fallback opt out rule code in its canonical FOOR- form. */
export function normalizeFallbackOptOutRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FOOR-")) return clean;
  return `FOOR-${clean.replaceAll(" ", "-")}`;
}

export function fallbackOptOutRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 77308.0, in order. */
export function fallbackOptOutRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 77308) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
