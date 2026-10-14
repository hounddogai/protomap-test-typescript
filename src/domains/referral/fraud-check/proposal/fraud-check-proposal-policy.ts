import * as numbers from "../../../../kit/numbers.js";

/** Puts a fraud check proposal code in its canonical FCP- form. */
export function normalizeFraudCheckProposalCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FCP-")) return clean;
  return `FCP-${clean.replaceAll(" ", "-")}`;
}

export function fraudCheckProposalSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 45205.0, in order. */
export function fraudCheckProposalBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 45205) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function fraudCheckProposalBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
