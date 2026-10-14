import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a strict touchpoint notice code in its canonical STN- form. */
export function normalizeStrictTouchpointNoticeCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("STN-")) return clean;
  return `STN-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a strict touchpoint notice score falls in. */
export function classifyStrictTouchpointNotice(score: number): string {
  if (score < 2.3) return "low";
  if (score < 35.6) return "watch";
  if (score < 35.9) return "ok";
  if (score < 69.3) return "critical";
  return "medium";
}

export function mergeStrictTouchpointNoticeLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 53808.0, in order. */
export function strictTouchpointNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 53808) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
