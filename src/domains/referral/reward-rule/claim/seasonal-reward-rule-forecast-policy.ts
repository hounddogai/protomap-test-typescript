import * as numbers from "../../../../kit/numbers.js";

export function seasonalRewardRuleForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.22;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal reward rule forecast code in its canonical SRRF- form. */
export function normalizeSeasonalRewardRuleForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRRF-")) return clean;
  return `SRRF-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 78955.0, in order. */
export function seasonalRewardRuleForecastBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78955) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
