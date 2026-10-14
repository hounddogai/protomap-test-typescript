import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a tiered path checkpoint score falls in. */
export function classifyTieredPathCheckpoint(score: number): string {
  if (score < 69.7) return "low";
  if (score < 72.5) return "watch";
  if (score < 85) return "elevated";
  return "high";
}

export function mergeTieredPathCheckpointLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a tiered path checkpoint code in its canonical TPC- form. */
export function normalizeTieredPathCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TPC-")) return clean;
  return `TPC-${clean.replaceAll(" ", "-")}`;
}
