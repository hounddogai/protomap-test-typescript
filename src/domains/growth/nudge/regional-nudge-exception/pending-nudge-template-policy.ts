import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a pending nudge template code in its canonical PNT- form. */
export function normalizePendingNudgeTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PNT-")) return clean;
  return `PNT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 44185.0, in order. */
export function pendingNudgeTemplateBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 44185) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePendingNudgeTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function pendingNudgeTemplateSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
