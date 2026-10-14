import * as numbers from "../../../../kit/numbers.js";

export function exitRuleExceptionSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function exitRuleExceptionWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.64;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 84777.0, in order. */
export function exitRuleExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84777) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a exit rule exception code in its canonical ERE- form. */
export function normalizeExitRuleExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ERE-")) return clean;
  return `ERE-${clean.replaceAll(" ", "-")}`;
}
