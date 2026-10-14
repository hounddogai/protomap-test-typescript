import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 93177.0, in order. */
export function postRecordBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 93177) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a post record code in its canonical PR- form. */
export function normalizePostRecordCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PR-")) return clean;
  return `PR-${clean.replaceAll(" ", "-")}`;
}

export function mergePostRecordLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a post record score falls in. */
export function classifyPostRecord(score: number): string {
  if (score < 11.2) return "low";
  if (score < 11.3) return "ok";
  if (score < 26.6) return "watch";
  return "minimal";
}
