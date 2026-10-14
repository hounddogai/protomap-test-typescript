import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending deflection agreement code in its canonical PDA- form. */
export function normalizePendingDeflectionAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PDA-")) return clean;
  return `PDA-${clean.replaceAll(" ", "-")}`;
}

export function pendingDeflectionAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 84255.0, in order. */
export function pendingDeflectionAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84255) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
