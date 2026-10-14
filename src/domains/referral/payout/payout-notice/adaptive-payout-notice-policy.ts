import * as numbers from "../../../../kit/numbers.js";

export function adaptivePayoutNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.85;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a adaptive payout notice code in its canonical APN- form. */
export function normalizeAdaptivePayoutNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APN-")) return clean;
  return `APN-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 74636.0, in order. */
export function adaptivePayoutNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74636) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
