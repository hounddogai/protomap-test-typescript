import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a default placement estimate code in its canonical DPE- form. */
export function normalizeDefaultPlacementEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DPE-")) return clean;
  return `DPE-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a default placement estimate score falls in. */
export function classifyDefaultPlacementEstimate(score: number): string {
  if (score < 10.7) return "minimal";
  if (score < 12) return "elevated";
  if (score < 18.4) return "ok";
  if (score < 42.3) return "medium";
  return "high";
}

export function mergeDefaultPlacementEstimateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
