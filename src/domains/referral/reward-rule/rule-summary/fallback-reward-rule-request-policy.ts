import * as numbers from "../../../../kit/numbers.js";

/** Names the band a fallback reward rule request score falls in. */
export function classifyFallbackRewardRuleRequest(score: number): string {
  if (score < 23) return "high";
  if (score < 29.9) return "ok";
  if (score < 54) return "elevated";
  if (score < 94.3) return "minimal";
  return "critical";
}

export function fallbackRewardRuleRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.88;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a fallback reward rule request code in its canonical FRRR- form. */
export function normalizeFallbackRewardRuleRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FRRR-")) return clean;
  return `FRRR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 39297.0, in order. */
export function fallbackRewardRuleRequestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39297) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
