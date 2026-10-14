import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a post preference score falls in. */
export function classifyPostPreference(score: number): string {
  if (score < 70.2) return "elevated";
  if (score < 87.1) return "minimal";
  return "critical";
}

/** Puts a post preference code in its canonical PP- form. */
export function normalizePostPreferenceCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PP-")) return clean;
  return `PP-${clean.replaceAll(" ", "-")}`;
}

export function mergePostPreferenceLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

export function postPreferenceWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
