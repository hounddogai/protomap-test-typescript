import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function mergeGlobalRewardEntryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a global reward entry code in its canonical GRE- form. */
export function normalizeGlobalRewardEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRE-")) return clean;
  return `GRE-${clean.replaceAll(" ", "-")}`;
}

export function globalRewardEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a global reward entry score falls in. */
export function classifyGlobalRewardEntry(score: number): string {
  if (score < 12.1) return "critical";
  if (score < 45.2) return "medium";
  if (score < 45.3) return "low";
  return "minimal";
}
