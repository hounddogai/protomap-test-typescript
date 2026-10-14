import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLenientInviteExceptionLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 92615.0, in order. */
export function lenientInviteExceptionBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 92615) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a lenient invite exception code in its canonical LIE- form. */
export function normalizeLenientInviteExceptionCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LIE-")) return clean;
  return `LIE-${clean.replaceAll(" ", "-")}`;
}
