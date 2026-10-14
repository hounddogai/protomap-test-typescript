import * as numbers from "../../../../kit/numbers.js";

/** Names the band a credit preference score falls in. */
export function classifyCreditPreference(score: number): string {
  if (score < 47.1) return "elevated";
  if (score < 70.5) return "critical";
  if (score < 70.6) return "high";
  return "low";
}

/** Puts a credit preference code in its canonical CP- form. */
export function normalizeCreditPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CP-")) return clean;
  return `CP-${clean.replaceAll(" ", "-")}`;
}

export function creditPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 18406.0, in order. */
export function creditPreferenceBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18406) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
