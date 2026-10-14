import * as numbers from "../../../../kit/numbers.js";

export function manualPayoutReservationSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Counts how many amounts fit in a budget of 16295.0, in order. */
export function manualPayoutReservationBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 16295) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a manual payout reservation code in its canonical MPR- form. */
export function normalizeManualPayoutReservationCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MPR-")) return clean;
  return `MPR-${clean.replaceAll(" ", "-")}`;
}

export function manualPayoutReservationBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
