import * as numbers from "../../../../kit/numbers.js";

export function batchedOptOutScoreSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a batched opt out score code in its canonical BOOS- form. */
export function normalizeBatchedOptOutScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("BOOS-")) return clean;
  return `BOOS-${clean.replaceAll(" ", "-")}`;
}

export function batchedOptOutScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.15;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 7105.0, in order. */
export function batchedOptOutScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 7105) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
