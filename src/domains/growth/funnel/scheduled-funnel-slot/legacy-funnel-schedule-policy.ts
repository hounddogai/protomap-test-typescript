import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeLegacyFunnelScheduleLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Names the band a legacy funnel schedule score falls in. */
export function classifyLegacyFunnelSchedule(score: number): string {
  if (score < 33.8) return "medium";
  if (score < 37.1) return "high";
  return "minimal";
}

/** Counts how many amounts fit in a budget of 765.0, in order. */
export function legacyFunnelScheduleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 765) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a legacy funnel schedule code in its canonical LFS- form. */
export function normalizeLegacyFunnelScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LFS-")) return clean;
  return `LFS-${clean.replaceAll(" ", "-")}`;
}
