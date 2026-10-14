import * as numbers from "../../../../kit/numbers.js";

export function legacyLevelNoticeBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Counts how many amounts fit in a budget of 51447.0, in order. */
export function legacyLevelNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 51447) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a legacy level notice code in its canonical LLN- form. */
export function normalizeLegacyLevelNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LLN-")) return clean;
  return `LLN-${clean.replaceAll(" ", "-")}`;
}
