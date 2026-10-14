import * as numbers from "../../../../kit/numbers.js";

export function creditTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

/** Puts a credit template code in its canonical CT- form. */
export function normalizeCreditTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 84737.0, in order. */
export function creditTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 84737) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function creditTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
