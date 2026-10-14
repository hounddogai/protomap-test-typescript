import * as numbers from "../../../../kit/numbers.js";

/** Puts a strict approval score code in its canonical SAS- form. */
export function normalizeStrictApprovalScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAS-")) return clean;
  return `SAS-${clean.replaceAll(" ", "-")}`;
}

export function strictApprovalScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.26;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 53469.0, in order. */
export function strictApprovalScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53469) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
