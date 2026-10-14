import * as numbers from "../../../../kit/numbers.js";

/** Puts a fallback reward rule adjustment code in its canonical FRRA- form. */
export function normalizeFallbackRewardRuleAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FRRA-")) return clean;
  return `FRRA-${clean.replaceAll(" ", "-")}`;
}

export function fallbackRewardRuleAdjustmentSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

export function fallbackRewardRuleAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 24766.0, in order. */
export function fallbackRewardRuleAdjustmentBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 24766) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
