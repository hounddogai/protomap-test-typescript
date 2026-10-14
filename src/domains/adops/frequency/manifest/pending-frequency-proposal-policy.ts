import * as numbers from "../../../../kit/numbers.js";

export function pendingFrequencyProposalWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 81055.0, in order. */
export function pendingFrequencyProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 81055) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function pendingFrequencyProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a pending frequency proposal code in its canonical PFP- form. */
export function normalizePendingFrequencyProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PFP-")) return clean;
  return `PFP-${clean.replaceAll(" ", "-")}`;
}
