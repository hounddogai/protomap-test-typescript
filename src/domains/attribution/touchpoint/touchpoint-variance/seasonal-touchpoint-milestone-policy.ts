import * as numbers from "../../../../kit/numbers.js";

export function seasonalTouchpointMilestoneBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Counts how many amounts fit in a budget of 54341.0, in order. */
export function seasonalTouchpointMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 54341) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a seasonal touchpoint milestone code in its canonical STM- form. */
export function normalizeSeasonalTouchpointMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STM-")) return clean;
  return `STM-${clean.replaceAll(" ", "-")}`;
}

export function seasonalTouchpointMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 86400);
}
