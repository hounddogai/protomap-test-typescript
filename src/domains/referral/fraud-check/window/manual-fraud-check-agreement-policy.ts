import * as numbers from "../../../../kit/numbers.js";

export function manualFraudCheckAgreementBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Puts a manual fraud check agreement code in its canonical MFCA- form. */
export function normalizeManualFraudCheckAgreementCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFCA-")) return clean;
  return `MFCA-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 17940.0, in order. */
export function manualFraudCheckAgreementBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 17940) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
