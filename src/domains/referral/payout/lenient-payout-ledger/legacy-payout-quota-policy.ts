import * as numbers from "../../../../kit/numbers.js";

export function legacyPayoutQuotaBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a legacy payout quota code in its canonical LPQ- form. */
export function normalizeLegacyPayoutQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LPQ-")) return clean;
  return `LPQ-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 51571.0, in order. */
export function legacyPayoutQuotaBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51571) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
