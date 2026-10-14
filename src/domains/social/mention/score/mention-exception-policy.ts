import * as numbers from "../../../../kit/numbers.js";

export function mentionExceptionBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Puts a mention exception code in its canonical ME- form. */
export function normalizeMentionExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ME-")) return clean;
  return `ME-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 25606.0, in order. */
export function mentionExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 25606) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
