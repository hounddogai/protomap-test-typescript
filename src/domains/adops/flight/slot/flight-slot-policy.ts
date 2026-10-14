import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a flight slot code in its canonical FS- form. */
export function normalizeFlightSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FS-")) return clean;
  return `FS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 28299.0, in order. */
export function flightSlotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 28299) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a flight slot score falls in. */
export function classifyFlightSlot(score: number): string {
  if (score < 1.6) return "minimal";
  if (score < 10.8) return "high";
  if (score < 22.1) return "watch";
  return "low";
}

export function mergeFlightSlotLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
