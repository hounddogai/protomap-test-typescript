import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Counts how many amounts fit in a budget of 28370.0, in order. */
export function warmupCheckpointBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28370) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function mergeWarmupCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a warmup checkpoint code in its canonical WC- form. */
export function normalizeWarmupCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WC-")) return clean;
  return `WC-${clean.replaceAll(" ", "-")}`;
}
