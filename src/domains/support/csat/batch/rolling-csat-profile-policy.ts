import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

export function rollingCsatProfileWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.14;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a rolling csat profile score falls in. */
export function classifyRollingCsatProfile(score: number): string {
  if (score < 15.3) return "high";
  if (score < 88.5) return "elevated";
  return "minimal";
}

export function mergeRollingCsatProfileLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a rolling csat profile code in its canonical RCP- form. */
export function normalizeRollingCsatProfileCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCP-")) return clean;
  return `RCP-${clean.replaceAll(" ", "-")}`;
}
