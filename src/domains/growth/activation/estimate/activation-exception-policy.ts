import * as numbers from "../../../../kit/numbers.js";

export function activationExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function activationExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.54;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 25514.0, in order. */
export function activationExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25514) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a activation exception code in its canonical AE- form. */
export function normalizeActivationExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("AE-")) return clean;
  return `AE-${clean.replaceAll(" ", "-")}`;
}
