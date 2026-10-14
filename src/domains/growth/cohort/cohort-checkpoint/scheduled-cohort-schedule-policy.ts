import * as numbers from "../../../../kit/numbers.js";

export function scheduledCohortScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function scheduledCohortScheduleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a scheduled cohort schedule code in its canonical SCS- form. */
export function normalizeScheduledCohortScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SCS-")) return clean;
  return `SCS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 47132.0, in order. */
export function scheduledCohortScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47132) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
