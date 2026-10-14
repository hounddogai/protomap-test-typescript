import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a legacy funnel milestone code in its canonical LFM- form. */
export function normalizeLegacyFunnelMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFM-")) return clean;
  return `LFM-${clean.replaceAll(" ", "-")}`;
}

export function mergeLegacyFunnelMilestoneLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function legacyFunnelMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

/** Counts how many amounts fit in a budget of 52888.0, in order. */
export function legacyFunnelMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 52888) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
