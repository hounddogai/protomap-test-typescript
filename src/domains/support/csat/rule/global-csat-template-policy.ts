import * as numbers from "../../../../kit/numbers.js";

export function globalCsatTemplateBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Puts a global csat template code in its canonical GCT- form. */
export function normalizeGlobalCsatTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GCT-")) return clean;
  return `GCT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 39522.0, in order. */
export function globalCsatTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 39522) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
