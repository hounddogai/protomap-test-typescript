import * as numbers from "../../../../kit/numbers.js";

export function adaptivePlacementGroupSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a adaptive placement group code in its canonical APG- form. */
export function normalizeAdaptivePlacementGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("APG-")) return clean;
  return `APG-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 69565.0, in order. */
export function adaptivePlacementGroupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 69565) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function adaptivePlacementGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
