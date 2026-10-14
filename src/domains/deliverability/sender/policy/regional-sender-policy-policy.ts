import * as collections from "../../../../kit/collections.js";
import * as text from "../../../../kit/text.js";

/** Puts a regional sender policy code in its canonical RSP- form. */
export function normalizeRegionalSenderPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RSP-")) return clean;
  return `RSP-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a regional sender policy score falls in. */
export function classifyRegionalSenderPolicy(score: number): string {
  if (score < 8.3) return "elevated";
  if (score < 47.3) return "minimal";
  if (score < 63.5) return "low";
  return "medium";
}

export function mergeRegionalSenderPolicyLabels(left: string[], right: string[]): string[] {
  const merged = [...left];
  for (const tag of right) {
    merged.push(text.normalize(tag));
  }
  return collections.uniqueStrings(merged);
}
