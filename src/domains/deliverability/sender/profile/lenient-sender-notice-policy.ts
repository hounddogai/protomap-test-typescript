import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a lenient sender notice code in its canonical LSN- form. */
export function normalizeLenientSenderNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LSN-")) return clean;
  return `LSN-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 70734.0, in order. */
export function lenientSenderNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 70734) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeLenientSenderNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
