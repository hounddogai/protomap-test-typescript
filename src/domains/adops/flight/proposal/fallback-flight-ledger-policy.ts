import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 11114.0, in order. */
export function fallbackFlightLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 11114) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a fallback flight ledger code in its canonical FFL- form. */
export function normalizeFallbackFlightLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FFL-")) return clean;
  return `FFL-${clean.replaceAll(" ", "-")}`;
}

export function mergeFallbackFlightLedgerLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function fallbackFlightLedgerBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
