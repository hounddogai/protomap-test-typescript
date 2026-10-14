import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

export function mergeAdaptiveCsatTemplateLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}

/** Puts a adaptive csat template code in its canonical ACT- form. */
export function normalizeAdaptiveCsatTemplateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("ACT-")) return clean;
  return `ACT-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a adaptive csat template score falls in. */
export function classifyAdaptiveCsatTemplate(score: number): string {
  if (score < 27.8) return "high";
  if (score < 79.7) return "low";
  return "ok";
}
