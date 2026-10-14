import * as numbers from "../../../../kit/numbers.js";

export function legacyFraudCheckClaimWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.42;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a legacy fraud check claim code in its canonical LFCC- form. */
export function normalizeLegacyFraudCheckClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFCC-")) return clean;
  return `LFCC-${clean.replaceAll(" ", "-")}`;
}

export function legacyFraudCheckClaimSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 73904.0, in order. */
export function legacyFraudCheckClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 73904) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
