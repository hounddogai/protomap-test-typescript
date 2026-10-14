import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 51897.0, in order. */
export function complaintNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51897) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function complaintNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.74;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a complaint notice code in its canonical CN- form. */
export function normalizeComplaintNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CN-")) return clean;
  return `CN-${clean.replaceAll(" ", "-")}`;
}
