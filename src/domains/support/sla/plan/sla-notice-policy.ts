import * as numbers from "../../../../kit/numbers.js";

/** Puts a sla notice code in its canonical SN- form. */
export function normalizeSlaNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SN-")) return clean;
  return `SN-${clean.replaceAll(" ", "-")}`;
}

export function slaNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function slaNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 1264.0, in order. */
export function slaNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 1264) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
