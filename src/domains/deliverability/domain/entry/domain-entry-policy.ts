import * as numbers from "../../../../kit/numbers.js";

/** Puts a domain entry code in its canonical DE- form. */
export function normalizeDomainEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DE-")) return clean;
  return `DE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 74730.0, in order. */
export function domainEntryBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 74730) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function domainEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function domainEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
