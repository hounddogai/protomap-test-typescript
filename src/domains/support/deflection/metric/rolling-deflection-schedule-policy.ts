import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 50452.0, in order. */
export function rollingDeflectionScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 50452) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a rolling deflection schedule code in its canonical RDS- form. */
export function normalizeRollingDeflectionScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RDS-")) return clean;
  return `RDS-${clean.replaceAll(" ", "-")}`;
}

export function rollingDeflectionScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function rollingDeflectionScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}
