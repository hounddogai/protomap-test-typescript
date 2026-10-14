import * as numbers from "../../../../kit/numbers.js";

export function bidRuleMappingSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 37694.0, in order. */
export function bidRuleMappingBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 37694) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function bidRuleMappingWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.39;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a bid rule mapping code in its canonical BRM- form. */
export function normalizeBidRuleMappingCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BRM-")) return clean;
  return `BRM-${clean.replaceAll(" ", "-")}`;
}
