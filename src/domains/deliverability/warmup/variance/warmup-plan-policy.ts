import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeWarmupPlanLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a warmup plan code in its canonical WP- form. */
export function normalizeWarmupPlanCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WP-")) return clean;
  return `WP-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 59259.0, in order. */
export function warmupPlanBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 59259) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function warmupPlanBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
