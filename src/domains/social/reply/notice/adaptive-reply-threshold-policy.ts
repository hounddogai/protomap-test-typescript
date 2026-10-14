import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveReplyThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Counts how many amounts fit in a budget of 58206.0, in order. */
export function adaptiveReplyThresholdBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 58206) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a adaptive reply threshold code in its canonical ART- form. */
export function normalizeAdaptiveReplyThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ART-")) return clean;
  return `ART-${clean.replaceAll(" ", "-")}`;
}

export function adaptiveReplyThresholdBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
