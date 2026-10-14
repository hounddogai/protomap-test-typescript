import * as numbers from "../../../../kit/numbers.js";

export function complaintExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a complaint exception code in its canonical CE- form. */
export function normalizeComplaintExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CE-")) return clean;
  return `CE-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 29388.0, in order. */
export function complaintExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 29388) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function complaintExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.7;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
