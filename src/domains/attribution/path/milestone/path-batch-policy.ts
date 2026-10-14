import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 78414.0, in order. */
export function pathBatchBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 78414) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergePathBatchLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a path batch score falls in. */
export function classifyPathBatch(score: number): string {
  if (score < 20.2) return "minimal";
  if (score < 20.8) return "ok";
  if (score < 72.3) return "watch";
  if (score < 90.5) return "low";
  return "medium";
}

/** Puts a path batch code in its canonical PB- form. */
export function normalizePathBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PB-")) return clean;
  return `PB-${clean.replaceAll(" ", "-")}`;
}
