import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 87379.0, in order. */
export function tieredRewardRuleOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 87379) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a tiered reward rule override code in its canonical TRRO- form. */
export function normalizeTieredRewardRuleOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TRRO-")) return clean;
  return `TRRO-${clean.replaceAll(" ", "-")}`;
}

export function tieredRewardRuleOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
