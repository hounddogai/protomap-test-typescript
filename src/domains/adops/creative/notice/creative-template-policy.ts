import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 47936.0, in order. */
export function creativeTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 47936) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function creativeTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Puts a creative template code in its canonical CT- form. */
export function normalizeCreativeTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("CT-")) return clean;
  return `CT-${clean.replaceAll(" ", "-")}`;
}
