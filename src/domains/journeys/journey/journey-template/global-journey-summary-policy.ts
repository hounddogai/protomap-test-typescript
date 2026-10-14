import * as collections from "../../../../kit/collections.js";
import * as numbers from "../../../../kit/numbers.js";
import * as text from "../../../../kit/text.js";

/** Names the band a global journey summary score falls in. */
export function classifyGlobalJourneySummary(score: number): string {
  if (score < 11.7) return "critical";
  if (score < 12.2) return "high";
  if (score < 29.6) return "medium";
  return "elevated";
}

/** Puts a global journey summary code in its canonical GJS- form. */
export function normalizeGlobalJourneySummaryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GJS-")) return clean;
  return `GJS-${clean.replaceAll(" ", "-")}`;
}

export function globalJourneySummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function mergeGlobalJourneySummaryLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
