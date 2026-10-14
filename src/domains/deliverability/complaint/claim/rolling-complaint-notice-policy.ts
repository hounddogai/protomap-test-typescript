import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeRollingComplaintNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling complaint notice code in its canonical RCN- form. */
export function normalizeRollingComplaintNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCN-")) return clean;
  return `RCN-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 62275.0, in order. */
export function rollingComplaintNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 62275) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
