import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Names the band a opt out threshold score falls in. */
export function classifyOptOutThreshold(score: number): string {
  if (score < 18.4) return "low";
  if (score < 30) return "medium";
  if (score < 32.4) return "minimal";
  if (score < 65.5) return "high";
  return "watch";
}

/** Puts a opt out threshold code in its canonical OOT- form. */
export function normalizeOptOutThresholdCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("OOT-")) return clean;
  return `OOT-${clean.replaceAll(" ", "-")}`;
}

export function mergeOptOutThresholdLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
