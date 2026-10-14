import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 13746.0, in order. */
export function domainBudgetBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 13746) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a domain budget code in its canonical DB- form. */
export function normalizeDomainBudgetCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DB-")) return clean;
  return `DB-${clean.replaceAll(" ", "-")}`;
}

export function domainBudgetWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function domainBudgetSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
